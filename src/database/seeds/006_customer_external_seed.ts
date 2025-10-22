import { Knex } from 'knex';
import * as dotenv from 'dotenv';
import externalKnexConfig from '../../../knexfile.external';
import * as crypto from 'crypto';
import { CustomerStatus, CustomerType, CustomerPlatform } from '../../modules/customer/entities/customer.entity';

// Load environment variables
dotenv.config();

/**
 * Interface for external customer data from MySQL tab_encerrain
 */
interface ExternalCustomerData {
  mobile: string | number;
  name: string;
  photo: string;
  cnpj: string | number;
  email: string;
  telefone: string | number;
  dten: string; // Date field for filtering September data
}

/**
 * Interface for the final customer record to be inserted
 */
interface CustomerRecord {
  id: string;
  platformId: string;
  pushName?: string;
  name?: string;
  profilePicUrl?: string;
  contact?: string;
  email?: string;
  cpf?: string;
  cnpj?: string;
  priority: number;
  isGroup: boolean;
  type: CustomerType;
  status: CustomerStatus;
  platform: CustomerPlatform;
  observations?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper function to validate if a mobile number is a valid Brazilian cell phone
 */
function isValidBrazilianCellPhone(mobile: string | number): boolean {
  if (!mobile) return false;
  
  // Remove all non-numeric characters
  const cleanMobile = String(mobile).replace(/\D/g, '');
  
  // Brazilian cell phone patterns:
  // - 11 digits starting with 9 (like 11999999999)
  // - 13 digits with country code (like 5511999999999)
  const cellPhonePattern = /^(55)?([1-9][1-9])9\d{8}$/;
  
  return cellPhonePattern.test(cleanMobile);
}

/**
 * Helper function to validate if a string is a valid CNPJ
 */
function isValidCNPJ(cnpj: string | number): boolean {
  if (!cnpj) return false;
  
  // Remove all non-numeric characters
  const cleanCNPJ = String(cnpj).replace(/\D/g, '');
  
  // CNPJ must have 14 digits
  if (cleanCNPJ.length !== 14) return false;
  
  // Check for invalid patterns (all same digits, etc.)
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  // Basic CNPJ validation (check digits)
  let sum = 0;
  let weight = 2;
  
  // Calculate first check digit
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCNPJ[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  
  const firstCheckDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cleanCNPJ[12]) !== firstCheckDigit) return false;
  
  // Calculate second check digit
  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCNPJ[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  
  const secondCheckDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cleanCNPJ[13]) !== secondCheckDigit) return false;
  
  return true;
}

/**
 * Helper function to clean phone numbers (remove non-numeric characters)
 */
function cleanPhoneNumber(phone: string | number): string | null {
  if (!phone) return null;
  
  const cleanPhone = String(phone).replace(/\D/g, '');
  return cleanPhone === '' ? null : cleanPhone;
}

/**
 * Helper function to safely parse text values
 */
function safeParseText(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  
  const str = String(value).trim();
  return str === '' ? null : str;
}

/**
 * Helper function to get month name from month number
 */
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
}

/**
 * Helper function to generate platform ID based on mobile/telefone
 */
function generatePlatformId(mobile: string | number, telefone: string | number): string {
  // Use mobile field directly without validation
  const cleanNumber = cleanPhoneNumber(mobile);
  
  // If we have a number from mobile, use it; otherwise generate a unique ID
  return cleanNumber || `external_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function seed(knex: Knex): Promise<void> {
  console.log('🌱 Starting customer external seed...');

  // Clear existing data (optional - comment out if you want to keep existing customers)
  // await knex('customer').del();
  console.log('📋 Note: Existing customer data will be preserved (no deletion performed)');

  // Create external database connection (MySQL)
  const environment = process.env.NODE_ENV || 'development';
  const externalConfig = externalKnexConfig[environment];
  
  if (!externalConfig) {
    console.log('⚠️  External database configuration not found. Skipping customer external seed.');
    return;
  }

  // Create external knex instance
  const externalKnex = require('knex')(externalConfig);
  
  try {
    // Test the external connection
    await externalKnex.raw('SELECT 1');
    console.log('✅ External database connection established');
  } catch (error) {
    console.log('⚠️  Cannot connect to external database. Skipping seed.');
    console.log(`Error: ${error.message}`);
    return;
  }

  try {
    // Step 1: Fetch external data from MySQL tab_encerrain table
    console.log('📡 Fetching external data from MySQL tab_encerrain table...');
    const result = await externalKnex.raw(`
      SELECT mobile, name, photo, cnpj, email, telefone, dten
      FROM tab_encerrain t1
      WHERE (mobile IS NOT NULL OR telefone IS NOT NULL)
        AND dten = (
          SELECT MAX(t2.dten)
          FROM tab_encerrain t2
          WHERE t2.mobile = t1.mobile
        )
    `);

    // Extract the actual data from knex.raw result
    const externalData: ExternalCustomerData[] = result[0];
    
    console.log(`📊 Found ${externalData.length} external customer records`);

    if (externalData.length === 0) {
      console.log('⚠️  No external data found. Skipping seed.');
      return;
    }

    // Step 2: Process external records in batches
    const batchSize = parseInt(process.env.CUSTOMER_BATCH_SIZE || '100');
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalSkipped = 0;
    const startTime = Date.now();
    
    console.log(`📦 Processing ${externalData.length} records in batches of ${batchSize}...`);
    
    for (let i = 0; i < externalData.length; i += batchSize) {
      const batch = externalData.slice(i, i + batchSize);
      const customersToInsert: CustomerRecord[] = [];
      
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(externalData.length / batchSize);
      const progressPercent = ((i / externalData.length) * 100).toFixed(1);
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records) - ${progressPercent}% complete...`);
      
      for (const externalRecord of batch) {
        try {
          console.log(`🔍 Processing customer ${totalProcessed + 1}/${externalData.length}:`, {
            mobile: externalRecord.mobile,
            name: externalRecord.name,
            email: externalRecord.email,
            telefone: externalRecord.telefone,
            cnpj: externalRecord.cnpj,
            dten: externalRecord.dten
          });
          
          // Step 2a: Transform and validate data
          const customerRecord = await transformToCustomerRecord(externalRecord, knex);
          
          if (customerRecord) {
            customersToInsert.push(customerRecord);
            console.log(`✅ Processed customer record for ${customerRecord.name || customerRecord.platformId}`);
          } else {
            totalSkipped++;
            console.log(`⏭️  Skipped invalid customer record`);
          }
          
          totalProcessed++;
        } catch (error) {
          console.error(`❌ Error processing customer record:`, error);
          totalSkipped++;
          totalProcessed++;
        }
      }

      // Step 3: Insert batch into the database
      if (customersToInsert.length > 0) {
        console.log(`💾 Inserting batch of ${customersToInsert.length} customer records into database...`);
        
        // Check for duplicates before inserting
        const uniqueCustomers = await filterDuplicateCustomers(customersToInsert, knex);
        
        if (uniqueCustomers.length > 0) {
          await knex('customer').insert(uniqueCustomers);
          totalInserted += uniqueCustomers.length;
          console.log(`✅ Batch inserted successfully! Total inserted: ${totalInserted}`);
        } else {
          console.log(`⏭️  All customers in batch were duplicates, skipping insertion`);
        }
      }
    }
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000; // in seconds
    
    console.log('✅ Customer external seed completed successfully!');
    console.log(`📊 Total customer records processed: ${totalProcessed}`);
    console.log(`📊 Total customer records inserted: ${totalInserted}`);
    console.log(`📊 Total customer records skipped: ${totalSkipped}`);
    console.log(`📊 Batches processed: ${Math.ceil(externalData.length / batchSize)}`);
    console.log(`⏱️  Total processing time: ${totalTime.toFixed(2)} seconds`);
    console.log(`📈 Average time per record: ${(totalTime / totalProcessed).toFixed(3)} seconds`);
    console.log(`📈 Records per second: ${(totalProcessed / totalTime).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error during customer external seed:', error);
  } finally {
    // Close external database connection
    if (externalKnex) {
      await externalKnex.destroy();
      console.log('🔌 External database connection closed');
    }
  }
}

/**
 * Transforms external data into customer record
 */
async function transformToCustomerRecord(external: ExternalCustomerData, knex: Knex): Promise<CustomerRecord | null> {
  const now = new Date();
  
  // Generate UUID for id field based on mobile/telefone and additional unique data
  const primaryIdentifier = external.mobile || external.telefone;
  if (!primaryIdentifier) {
    console.log('⚠️  No mobile or telefone found, skipping record');
    return null;
  }
  
  // Create a more unique identifier by combining multiple fields
  const uniqueData = `${primaryIdentifier}_${external.name || ''}_${external.email || ''}_${external.dten || ''}`;
  const idHash = crypto.createHash('md5').update(String(uniqueData)).digest('hex');
  const uuid = [
    idHash.substring(0, 8),
    idHash.substring(8, 12),
    idHash.substring(12, 16),
    idHash.substring(16, 20),
    idHash.substring(20),
  ].join('-');

  // Determine if mobile is a valid cell phone or CNPJ
  const isMobileCellPhone = isValidBrazilianCellPhone(external.mobile);
  const isMobileCNPJ = !isMobileCellPhone && isValidCNPJ(external.mobile);
  
  // Generate platform ID
  // const platformId = generatePlatformId(external.mobile, external.telefone);
  
  // Determine contact field based on validation
  let contact: string | undefined;
  let cnpj: string | undefined;
  
  if (isMobileCellPhone) {
    // Mobile is a valid cell phone, use it as contact
    contact = cleanPhoneNumber(external.mobile) || undefined;
    cnpj = external.cnpj ? cleanPhoneNumber(external.cnpj) || undefined : undefined;
  } else if (isMobileCNPJ) {
    // Mobile is a valid CNPJ, use telefone as contact
    cnpj = cleanPhoneNumber(external.mobile) || undefined;
    contact = external.telefone ? cleanPhoneNumber(external.telefone) || undefined : undefined;
  } else {
    // Mobile is neither valid cell phone nor CNPJ, use telefone as contact
    contact = external.telefone ? cleanPhoneNumber(external.telefone) || undefined : undefined;
    cnpj = external.cnpj ? cleanPhoneNumber(external.cnpj) || undefined : undefined;
  }
  console.log('external.mobile', external.mobile);
  return {
    id: uuid,
    platformId: external.mobile.toString(),
    pushName: safeParseText(external.name) || undefined,
    name: safeParseText(external.name) || undefined,
    profilePicUrl: safeParseText(external.photo) || undefined,
    contact,
    email: safeParseText(external.email) || undefined,
    cpf: undefined, // Not provided in external data
    cnpj,
    priority: 0, // Default priority
    isGroup: false, // Default to individual contact
    type: CustomerType.CONTACT,
    status: CustomerStatus.ACTIVE,
    platform: CustomerPlatform.WHATSAPP, // Default platform
    observations: `Imported from external database - Mobile: ${external.mobile}, Telefone: ${external.telefone}, Date: ${external.dten}`,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Filters out duplicate customers based on platformId and ID
 */
async function filterDuplicateCustomers(customers: CustomerRecord[], knex: Knex): Promise<CustomerRecord[]> {
  if (customers.length === 0) return [];
  
  const platformIds = customers.map(c => c.platformId);
  const customerIds = customers.map(c => c.id);
  
  // Check which platformIds and IDs already exist
  const existingCustomers = await knex('customer')
    .select('platformId', 'id')
    .whereIn('platformId', platformIds)
    .orWhereIn('id', customerIds);
  
  const existingPlatformIds = new Set(existingCustomers.map(c => c.platformId));
  const existingCustomerIds = new Set(existingCustomers.map(c => c.id));
  
  // Filter out duplicates based on both platformId and ID
  return customers.filter(customer => 
    !existingPlatformIds.has(customer.platformId) && 
    !existingCustomerIds.has(customer.id)
  );
}

