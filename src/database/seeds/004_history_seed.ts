import { Knex } from 'knex';
import * as dotenv from 'dotenv';
import externalKnexConfig from '../../../knexfile.external';
import * as crypto from 'crypto';

// Load environment variables
dotenv.config();

/**
 * Interface for external history data from MySQL tab_encerrain
 */
interface ExternalHistoryData {
  sessionid: string;
  mobile: string;
  dtin: string;
  dtat: string;
  dten: string;
  name: string;
  account: string;
  photo: string;
  fkto: string;
  fkname: string;
  transfer: number;
  status: number;
  cnpj: string;
  segmento: string;
  atendir: string;
  pedido: string;
  valor: string;
  reports: number;
  sessionBot: string;
  origem: string;
  email: string;
  telefone: string;
  avaliacao: string;
}

/**
 * Interface for external transbordo data to enrich history
 */
interface ExternalTransbordoData {
  sessionBot: string;
  origin: string;
  destination: string;
  segment: string;
}

/**
 * Interface for the final history record to be inserted
 */
interface HistoryRecord {
  id: string;
  sessionId: string;
  userId: string | null;
  customerId: string | null;
  transferId: string | null;
  observations: string | null;
  platform: 'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'other';
  startedAt: Date;
  attendedAt: Date | null;
  finishedAt: Date | null;
  origin: string | null; // Where the chat started (whatsapp, chatweb, etc.)
  destiny: string | null; // Who finished the journey (bot, human, etc.)
  segment: string | null; // Customer segment
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
 * Fetches transbordo data to enrich history records
 */
async function fetchTransbordoData(externalKnex: any): Promise<Map<string, ExternalTransbordoData>> {
  try {
    console.log('📡 Fetching transbordo data to enrich history...');
    const result = await externalKnex.raw(`
      SELECT sessionBot, origem as origin, destino as destination, segmanto as segment
      FROM tab_transbordo 
      WHERE sessionBot IS NOT NULL
    `);
    
    const transbordoData = result[0];
    console.log(`📊 Found ${transbordoData.length} transbordo records`);
    
    // Create a map for quick lookup by sessionBot
    const transbordoMap = new Map<string, ExternalTransbordoData>();
    
    for (const record of transbordoData) {
      if (record.sessionBot) {
        transbordoMap.set(record.sessionBot, {
          sessionBot: record.sessionBot,
          origin: safeParseText(record.origin) || '',
          destination: safeParseText(record.destination) || '',
          segment: safeParseText(record.segment) || ''
        });
      }
    }
    
    console.log(`📊 Created transbordo lookup map with ${transbordoMap.size} entries`);
    return transbordoMap;
  } catch (error) {
    console.error('❌ Error fetching transbordo data:', error);
    return new Map();
  }
}

/**
 * Helper function to determine platform from origem field
 */
function determinePlatform(origem: string): 'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'other' {
  if (!origem) return 'whatsapp';
  
  const origemLower = origem.toLowerCase();
  
  if (origemLower.includes('whatsapp') || origemLower.includes('wa')) {
    return 'whatsapp';
  }
  if (origemLower.includes('telegram') || origemLower.includes('tg')) {
    return 'telegram';
  }
  if (origemLower.includes('instagram') || origemLower.includes('ig')) {
    return 'instagram';
  }
  if (origemLower.includes('facebook') || origemLower.includes('fb')) {
    return 'facebook';
  }
  
  return 'other';
}

/**
 * Helper function to find or create customer
 */
async function findOrCreateCustomer(knex: Knex, external: ExternalHistoryData): Promise<string | null> {
  try {
    // Try to find existing customer by mobile/phone
    const existingCustomer = await knex('customer')
      .where('contact', external.mobile || external.telefone)
      .first();

    if (existingCustomer) {
      return existingCustomer.id;
    }

    // Create new customer if not found
    const customerId = crypto.randomUUID();
    const customerData = {
      id: customerId,
      platformId: external.mobile || external.telefone || crypto.randomUUID(),
      pushName: external.name || 'Unknown',
      name: external.name || 'Unknown Customer',
      profilePicUrl: external.photo || null,
      contact: external.mobile || external.telefone || null,
      email: external.email || null,
      cnpj: external.cnpj || null,
      priority: safeParseNumber(external.status),
      isGroup: false,
      type: 'contact' as const,
      status: 'active' as const,
      platform: determinePlatform(external.origem),
      observations: `Imported from tab_encerrain. Original session: ${external.sessionid}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await knex('customer').insert(customerData);
    return customerId;
  } catch (error) {
    console.error('Error creating customer:', error);
    return null;
  }
}

/**
 * Helper function to find user by name or create default
 */
async function findUser(knex: Knex, atendir: string): Promise<string | null> {
  try {
    if (!atendir) return null;

    // Try to find user by name
    const user = await knex('user')
      .where('name', 'ilike', `%${atendir}%`)
      .first();

    if (user) return user.id;

    // If not found, return null (will be handled as system interaction)
    return null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

/**
 * Helper function to find transfer by segment
 */
async function findTransfer(knex: Knex, segmento: string): Promise<string | null> {
  try {
    if (!segmento) return null;

    // Try to find transfer by name containing segment
    const transfer = await knex('transfer')
      .where('name', 'ilike', `%${segmento}%`)
      .first();

    if (transfer) return transfer.id;

    // Return first available transfer as fallback
    const fallbackTransfer = await knex('transfer')
      .where('status', 'active')
      .first();

    return fallbackTransfer?.id || null;
  } catch (error) {
    console.error('Error finding transfer:', error);
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
    console.log('⚠️  Cannot connect to external database. Using sample data instead.');
    console.log(`Error: ${error.message}`);
    await createSampleHistory(knex);
    return;
  }

  try {
    // Step 1: Fetch external data from MySQL tab_encerrain table
    console.log('📡 Fetching external data from MySQL tab_encerrain table...');
    const result = await externalKnex.raw(`
      SELECT sessionid, mobile, dtin, dtat, dten, name, account, photo, fkto, fkname, 
             transfer, status, cnpj, segmento, atendir, pedido, valor, reports, 
             sessionBot, origem, email, telefone, avaliacao
      FROM tab_encerrain 
      WHERE sessionid IS NOT NULL
    `);
    
    // Extract the actual data from knex.raw result
    const externalData: ExternalHistoryData[] = result[0];
    
    console.log(`📊 Found ${externalData.length} external records`);

    if (externalData.length === 0) {
      console.log('⚠️  No external data found. Creating sample data...');
      await createSampleHistory(knex);
      return;
    }

    // Step 1.5: Fetch transbordo data to enrich history records
    const transbordoMap = await fetchTransbordoData(externalKnex);

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
            name: externalRecord.name,
            mobile: externalRecord.mobile,
            segmento: externalRecord.segmento,
            atendir: externalRecord.atendir,
            origem: externalRecord.origem
          });
          
          // Step 2a: Find or create customer
          const customerId = await findOrCreateCustomer(knex, externalRecord);
          
          // Step 2b: Find user
          const userId = await findUser(knex, externalRecord.atendir);
          
          // Step 2c: Find transfer
          const transferId = await findTransfer(knex, externalRecord.segmento);
          
          // Step 2d: Transform and combine data
          const historyRecord = transformToHistoryRecord(externalRecord, customerId, userId, transferId, transbordoMap);
          historyToInsert.push(historyRecord);
          
          console.log(`✅ Processed history record ${externalRecord.sessionid}`);
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
    console.log('🔄 Creating sample history as fallback...');
    await createSampleHistory(knex);
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
  userId: string | null, 
  transferId: string | null,
  transbordoMap: Map<string, ExternalTransbordoData>
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
  const startedAt = safeParseDate(external.dtin) || now;
  const attendedAt = safeParseDate(external.dtat);
  const finishedAt = safeParseDate(external.dten);

  // Look up transbordo data using sessionBot
  const transbordoData = transbordoMap.get(external.sessionBot);
  
  // Create observations from available data
  const observations = [
    `Original session: ${external.sessionid}`,
    external.pedido ? `Order: ${external.pedido}` : null,
    external.valor ? `Value: ${external.valor}` : null,
    external.avaliacao ? `Rating: ${external.avaliacao}` : null,
    external.reports ? `Reports: ${external.reports}` : null,
    external.transfer ? `Transfer: ${external.transfer}` : null,
    transbordoData ? `Transbordo: ${transbordoData.origin} → ${transbordoData.destination}` : null,
  ].filter(Boolean).join(' | ');

  return {
    id: uuid,
    sessionId: external.sessionid,
    userId,
    customerId,
    transferId,
    observations: observations || null,
    platform: determinePlatform(external.origem),
    startedAt,
    attendedAt,
    finishedAt,
    origin: transbordoData?.origin || null, // Where the chat started
    destiny: transbordoData?.destination || null, // Who finished the journey
    segment: transbordoData?.segment || safeParseText(external.segmento), // Customer segment
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Creates sample history when external data is not available
 */
async function createSampleHistory(knex: Knex): Promise<void> {
  const sampleHistory: HistoryRecord[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      sessionId: 'session-001',
      userId: null,
      customerId: null,
      transferId: null,
      observations: 'Sample history record for testing',
      platform: 'whatsapp',
      startedAt: new Date('2024-01-15 10:30:00'),
      attendedAt: new Date('2024-01-15 10:35:00'),
      finishedAt: new Date('2024-01-15 11:00:00'),
      origin: 'whatsapp',
      destiny: 'human',
      segment: 'pharmaceutical',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      sessionId: 'session-002',
      userId: null,
      customerId: null,
      transferId: null,
      observations: 'Another sample history record',
      platform: 'telegram',
      startedAt: new Date('2024-01-16 14:15:00'),
      attendedAt: null,
      finishedAt: null,
      origin: 'chatweb',
      destiny: 'bot',
      segment: 'healthcare',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await knex('history').insert(sampleHistory);
  console.log('✅ Sample history created successfully!');
  console.log(`📊 Total sample history records created: ${sampleHistory.length}`);
}
