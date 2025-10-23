import { Knex } from 'knex';
import * as dotenv from 'dotenv';
import externalKnexConfig from '../../../knexfile.external';
import * as crypto from 'crypto';

// Load environment variables
dotenv.config();

/**
 * Interface for external history data from MySQL tab_encerrain with tab_transbordo join
 */
interface ExternalHistoryData {
  sessionid: string;
  sessionBot: string;
  userId: string; // fkto
  customerId: string; // mobile (need to get actual id from customer table)
  tabulationId: number; // status
  observations: string | null;
  platform: string; // 'whatsapp'
  segment: string; // segmento
  direction: string; // 'inbound' | 'outbound' based on atendir
  startedAt: string; // dtin
  attendedAt: string | null; // dtat
  finishedAt: string | null; // dten
  review: string | null; // avaliacao
}


/**
 * Interface for the final history record to be inserted
 */
interface HistoryRecord {
  id: string;
  sessionId: string;
  sessionBot: string | null;
  userId: string | null;
  customerId: string | null;
  tabulationId: string | null;
  observations: string | null;
  platform: 'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'other';
  segment: string | null;
  direction: 'inbound' | 'outbound';
  startedAt: Date;
  attendedAt: Date | null;
  finishedAt: Date | null;
  review: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper function to safely parse dates
 */
function safeParseDate(dateString: any): Date | null {
  if (!dateString) return null;
  
  try {
    // Check if it's already a valid Date object
    if (dateString instanceof Date && !isNaN(dateString.getTime())) {
      return dateString;
    }
    
    // Check for invalid date strings
    const str = String(dateString);
    if (str.includes('NaN') || str.includes('Invalid') || str === 'null' || str === 'undefined' || str === '0NaN-NaN-NaNTNaN:NaN:NaN.NaN+NaN:NaN') {
      return null;
    }
    
    const date = new Date(str);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (error) {
    return null;
  }
}

/**
 * Helper function to safely parse numeric values
 */
function safeParseNumber(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  
  try {
    const num = parseFloat(String(value));
    return isNaN(num) ? 0 : num;
  } catch (error) {
    return 0;
  }
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
 * Helper function to determine platform from origin field
 */
function determinePlatform(origin: string | null): 'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'other' {
  if (!origin) return 'whatsapp';
  
  const originLower = origin.toLowerCase();
  
  if (originLower.includes('whatsapp') || originLower.includes('wa')) {
    return 'whatsapp';
  }
  if (originLower.includes('telegram') || originLower.includes('tg')) {
    return 'telegram';
  }
  if (originLower.includes('instagram') || originLower.includes('ig')) {
    return 'instagram';
  }
  if (originLower.includes('facebook') || originLower.includes('fb')) {
    return 'facebook';
  }
  
  return 'other';
}

/**
 * Helper function to find customer by mobile/contact
 */
async function findCustomer(knex: Knex, mobile: string): Promise<string | null> {
  try {
    if (!mobile) return null;

    // Try to find existing customer by mobile/phone
    const existingCustomer = await knex('customer')
      .where('contact', mobile)
      .first();

    return existingCustomer?.id || null;
  } catch (error) {
    console.error('Error finding customer:', error);
    return null;
  }
}

/**
 * Helper function to find user by ID (handles numeric IDs from external data)
 */
async function findUser(knex: Knex, userId: string): Promise<string | null> {
  try {
    if (!userId) {
      console.log(`⚠️  Empty user ID provided`);
      return null;
    }

    console.log(`🔍 Looking for user with ID: ${userId}`);

    // fkto is the actual user.id, so we can directly query by ID
    const user = await knex('user')
      .where('id', userId)
      .first();

    if (user) {
      console.log(`✅ Found user: ${user.login} (ID: ${user.id})`);
      return user.id;
    } else {
      console.log(`❌ No user found with ID: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}



export async function seed(knex: Knex): Promise<void> {
  console.log('🌱 Starting history seed...');

  // Clear existing data
  await knex('history').del();
  console.log('🗑️  Cleared existing history data');

  // Create external database connection (MySQL)
  const environment = process.env.NODE_ENV || 'development';
  const externalConfig = externalKnexConfig[environment];
  
  if (!externalConfig) {
    console.log('⚠️  External database configuration not found. Skipping history seed.');
    return;
  }

  // Create external knex instance
  const externalKnex = require('knex')(externalConfig);
  
  try {
    // Test the external connection
    await externalKnex.raw('SELECT 1');
    console.log('✅ External database connection established');
  } catch (error) {
    console.log('⚠️  Cannot connect to external database. Skipping history seed.');
    console.log(`Error: ${error.message}`);
    return;
  }

  try {
    // Step 1: Fetch external data from MySQL tab_encerrain only
    console.log('📡 Fetching external data from MySQL tab_encerrain...');
    
    const result = await externalKnex.raw(`
      SELECT 
        e.sessionid,
        e.sessionBot,
        e.fkto AS 'userId',
        e.mobile AS 'customerId',
        e.status AS 'tabulationId',
        NULL AS 'observations',
        'whatsapp' AS 'platform',
        e.segmento AS 'segment',
        (CASE WHEN e.atendir='in' THEN 'inbound' ELSE 'outbound' END) AS 'direction',
        e.dtin AS 'startedAt',
        e.dtat AS 'attendedAt',
        e.dten AS 'finishedAt',
        e.avaliacao AS 'review'
      FROM tab_encerrain e
      WHERE YEAR(e.dten) = 2025
      ORDER BY e.dten DESC
    `);
    
    const externalData: ExternalHistoryData[] = result[0];
    
    console.log(`📊 Found ${externalData.length} external records`);

    if (externalData.length === 0) {
      console.log('⚠️  No external data found. Skipping history seed.');
      return;
    }

    // Step 2: Process external records in batches
    const batchSize = parseInt(process.env.HISTORY_BATCH_SIZE || '100');
    let totalProcessed = 0;
    let totalInserted = 0;
    const startTime = Date.now();
    
    console.log(`📦 Processing ${externalData.length} records in batches of ${batchSize}...`);
    
    for (let i = 0; i < externalData.length; i += batchSize) {
      const batch = externalData.slice(i, i + batchSize);
      const historyToInsert: HistoryRecord[] = [];
      
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(externalData.length / batchSize);
      const progressPercent = ((i / externalData.length) * 100).toFixed(1);
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records) - ${progressPercent}% complete...`);
      
      for (const externalRecord of batch) {
        try {
          console.log(`🔍 Processing record ${totalProcessed + 1}/${externalData.length}:`, {
            sessionid: externalRecord.sessionid,
            sessionBot: externalRecord.sessionBot,
            userId: externalRecord.userId,
            customerId: externalRecord.customerId,
            segment: externalRecord.segment,
            direction: externalRecord.direction
          });
          
          // Step 2a: Find customer by mobile
          const customerId = await findCustomer(knex, externalRecord.customerId);
          
          // Step 2b: Find user by ID
          const userId = await findUser(knex, externalRecord.userId);
          
          // Step 2c: Transform and combine data
          const historyRecord = transformToHistoryRecord(externalRecord, customerId, userId);
          historyToInsert.push(historyRecord);
          
          console.log(`✅ Processed history record ${externalRecord.sessionid} - Customer: ${customerId}, User: ${userId}`);
          totalProcessed++;
        } catch (error) {
          console.error(`❌ Error processing history record ${externalRecord.sessionid}:`, error);
          totalProcessed++;
        }
      }

      // Step 3: Insert batch into the database
      if (historyToInsert.length > 0) {
        console.log(`💾 Inserting batch of ${historyToInsert.length} history records into database...`);
        await knex('history').insert(historyToInsert);
        totalInserted += historyToInsert.length;
        console.log(`✅ Batch inserted successfully! Total inserted: ${totalInserted}`);
      }
    }
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000; // in seconds
    
    console.log('✅ History seeded successfully!');
    console.log(`📊 Total history records processed: ${totalProcessed}`);
    console.log(`📊 Total history records inserted: ${totalInserted}`);
    console.log(`📊 Batches processed: ${Math.ceil(externalData.length / batchSize)}`);
    console.log(`⏱️  Total processing time: ${totalTime.toFixed(2)} seconds`);
    console.log(`📈 Average time per record: ${(totalTime / totalProcessed).toFixed(3)} seconds`);
    console.log(`📈 Records per second: ${(totalProcessed / totalTime).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error during history seed:', error);
  } finally {
    // Close external database connection
    if (externalKnex) {
      await externalKnex.destroy();
      console.log('🔌 External database connection closed');
    }
  }
}

/**
 * Transforms external data into history record
 */
function transformToHistoryRecord(
  external: ExternalHistoryData, 
  customerId: string | null, 
  userId: string | null
): HistoryRecord {
  const now = new Date();
  
  // Generate UUID for id field
  const idHash = crypto.createHash('md5').update(String(external.sessionid)).digest('hex');
  const uuid = [
    idHash.substring(0, 8),
    idHash.substring(8, 12),
    idHash.substring(12, 16),
    idHash.substring(16, 20),
    idHash.substring(20),
  ].join('-');

  // Parse dates safely
  const startedAt = safeParseDate(external.startedAt) || now;
  const attendedAt = safeParseDate(external.attendedAt);
  const finishedAt = safeParseDate(external.finishedAt);

  // Create observations from available data
  const observations = [
    `Original session: ${external.sessionid}`,
    external.sessionBot ? `SessionBot: ${external.sessionBot}` : null,
    external.review ? `Review: ${external.review}` : null,
  ].filter(Boolean).join(' | ');

  return {
    id: uuid,
    sessionId: external.sessionid,
    sessionBot: safeParseText(external.sessionBot),
    userId,
    customerId,
    tabulationId: external.tabulationId ? String(external.tabulationId) : null,
    observations: observations || null,
    platform: 'whatsapp' as const,
    segment: safeParseText(external.segment),
    direction: external.direction as 'inbound' | 'outbound',
    startedAt,
    attendedAt,
    finishedAt,
    review: safeParseText(external.review),
    createdAt: now,
    updatedAt: now,
  };
}
