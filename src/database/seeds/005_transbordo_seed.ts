import { Knex } from 'knex';
import * as dotenv from 'dotenv';
import externalKnexConfig from '../../../knexfile.external';
import * as crypto from 'crypto';

// Load environment variables
dotenv.config();

/**
 * Interface for external transbordo data from MySQL tab_transbordo
 */
interface ExternalTransbordoData {
  id: string;
  cnpj: string;
  sessionBot: string;
  email: string;
  origem: string;
  destino: string;
  telephone: string;
  chatBot: string;
  chatHuman: string;
  dtin: string;
  dten: string;
  consultar_pedido: string;
  orcamento: string;
  novo_pedido: string;
  vacina: string;
  convert_compra: string;
  pedidos: string;
  transbordo_intent: string;
  jornadaStatus: string;
  valor: string;
  segmanto: string;
  avaliacao: string;
}

/**
 * Interface for the final transbordo record to be inserted
 */
interface TransbordoRecord {
  id: string;
  externalId: string;
  cnpj: string | null;
  sessionBot: string | null;
  email: string | null;
  origin: string | null;
  destination: string | null;
  telephone: string | null;
  chatBot: string | null;
  chatHuman: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  orderQuery: string | null;
  budget: string | null;
  newOrder: string | null;
  vaccine: string | null;
  purchaseConversion: string | null;
  orders: string | null;
  transferIntent: string | null;
  journeyStatus: string | null;
  value: number | null;
  segment: string | null;
  rating: string | null;
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
function safeParseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  
  try {
    const num = parseFloat(String(value));
    return isNaN(num) ? null : num;
  } catch (error) {
    return null;
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

export async function seed(knex: Knex): Promise<void> {
  console.log('🌱 Starting transbordo seed...');

  // Clear existing data
  await knex('transbordo').del();
  console.log('🗑️  Cleared existing transbordo data');

  // Create external database connection (MySQL)
  const environment = process.env.NODE_ENV || 'development';
  const externalConfig = externalKnexConfig[environment];
  
  if (!externalConfig) {
    console.log('⚠️  External database configuration not found. Skipping transbordo seed.');
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
    await createSampleTransbordo(knex);
    return;
  }

  try {
    // Step 1: Fetch external data from MySQL tab_transbordo table
    console.log('📡 Fetching external data from MySQL tab_transbordo table...');
    const result = await externalKnex.raw(`
      SELECT id, cnpj, sessionBot, email, origem, destino, telephone, chatBot, chatHuman, 
             dtin, dten, consultar_pedido, orcamento, novo_pedido, vacina, convert_compra, 
             pedidos, transbordo_intent, jornadaStatus, valor, segmanto, avaliacao
      FROM tab_transbordo 
      WHERE id IS NOT NULL
    `);
    
    // Extract the actual data from knex.raw result
    const externalData: ExternalTransbordoData[] = result[0];
    
    console.log(`📊 Found ${externalData.length} external records`);

    if (externalData.length === 0) {
      console.log('⚠️  No external data found. Creating sample data...');
      await createSampleTransbordo(knex);
      return;
    }

    // Step 2: Process external records in batches
    const batchSize = parseInt(process.env.TRANSBORDO_BATCH_SIZE || '100');
    let totalProcessed = 0;
    let totalInserted = 0;
    const startTime = Date.now();
    
    console.log(`📦 Processing ${externalData.length} records in batches of ${batchSize}...`);
    
    for (let i = 0; i < externalData.length; i += batchSize) {
      const batch = externalData.slice(i, i + batchSize);
      const transbordoToInsert: TransbordoRecord[] = [];
      
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(externalData.length / batchSize);
      const progressPercent = ((i / externalData.length) * 100).toFixed(1);
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records) - ${progressPercent}% complete...`);
      
      for (const externalRecord of batch) {
        try {
          console.log(`🔍 Processing record ${totalProcessed + 1}/${externalData.length}:`, {
            id: externalRecord.id,
            sessionBot: externalRecord.sessionBot,
            email: externalRecord.email,
            origem: externalRecord.origem,
            destino: externalRecord.destino,
            telephone: externalRecord.telephone
          });
          
          // Step 2a: Transform and combine data
          const transbordoRecord = transformToTransbordoRecord(externalRecord);
          transbordoToInsert.push(transbordoRecord);
          
          console.log(`✅ Processed transbordo record ${externalRecord.id}`);
          totalProcessed++;
        } catch (error) {
          console.error(`❌ Error processing transbordo record ${externalRecord.id}:`, error);
          totalProcessed++;
        }
      }

      // Step 3: Insert batch into the database
      if (transbordoToInsert.length > 0) {
        console.log(`💾 Inserting batch of ${transbordoToInsert.length} transbordo records into database...`);
        await knex('transbordo').insert(transbordoToInsert);
        totalInserted += transbordoToInsert.length;
        console.log(`✅ Batch inserted successfully! Total inserted: ${totalInserted}`);
      }
    }
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000; // in seconds
    
    console.log('✅ Transbordo seeded successfully!');
    console.log(`📊 Total transbordo records processed: ${totalProcessed}`);
    console.log(`📊 Total transbordo records inserted: ${totalInserted}`);
    console.log(`📊 Batches processed: ${Math.ceil(externalData.length / batchSize)}`);
    console.log(`⏱️  Total processing time: ${totalTime.toFixed(2)} seconds`);
    console.log(`📈 Average time per record: ${(totalTime / totalProcessed).toFixed(3)} seconds`);
    console.log(`📈 Records per second: ${(totalProcessed / totalTime).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error during transbordo seed:', error);
    console.log('🔄 Creating sample transbordo as fallback...');
    await createSampleTransbordo(knex);
  } finally {
    // Close external database connection
    if (externalKnex) {
      await externalKnex.destroy();
      console.log('🔌 External database connection closed');
    }
  }
}

/**
 * Transforms external data into transbordo record
 */
function transformToTransbordoRecord(external: ExternalTransbordoData): TransbordoRecord {
  const now = new Date();
  
  // Generate UUID for id field
  const idHash = crypto.createHash('md5').update(String(external.id)).digest('hex');
  const uuid = [
    idHash.substring(0, 8),
    idHash.substring(8, 12),
    idHash.substring(12, 16),
    idHash.substring(16, 20),
    idHash.substring(20),
  ].join('-');

  return {
    id: uuid,
    externalId: external.id,
    cnpj: safeParseText(external.cnpj),
    sessionBot: safeParseText(external.sessionBot),
    email: safeParseText(external.email),
    origin: safeParseText(external.origem),
    destination: safeParseText(external.destino),
    telephone: safeParseText(external.telephone),
    chatBot: safeParseText(external.chatBot),
    chatHuman: safeParseText(external.chatHuman),
    startedAt: safeParseDate(external.dtin),
    finishedAt: safeParseDate(external.dten),
    orderQuery: safeParseText(external.consultar_pedido),
    budget: safeParseText(external.orcamento),
    newOrder: safeParseText(external.novo_pedido),
    vaccine: safeParseText(external.vacina),
    purchaseConversion: safeParseText(external.convert_compra),
    orders: safeParseText(external.pedidos),
    transferIntent: safeParseText(external.transbordo_intent),
    journeyStatus: safeParseText(external.jornadaStatus),
    value: safeParseNumber(external.valor),
    segment: safeParseText(external.segmanto),
    rating: safeParseText(external.avaliacao),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Creates sample transbordo when external data is not available
 */
async function createSampleTransbordo(knex: Knex): Promise<void> {
  const sampleTransbordo: TransbordoRecord[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      externalId: 'TB001',
      cnpj: '12.345.678/0001-90',
      sessionBot: 'session-bot-001',
      email: 'customer1@example.com',
      origin: 'whatsapp',
      destination: 'human_agent',
      telephone: '+5511999999999',
      chatBot: 'Customer: I need help with my order\nBot: I can help you with that. What is your order number?',
      chatHuman: 'Agent: I can see your order #12345. It was shipped yesterday and should arrive tomorrow.',
      startedAt: new Date('2024-01-15 10:30:00'),
      finishedAt: new Date('2024-01-15 10:45:00'),
      orderQuery: 'Customer asked about order status',
      budget: 'Requested quote for 100 units',
      newOrder: null,
      vaccine: null,
      purchaseConversion: 'Customer showed interest in premium package',
      orders: 'Order #12345, Order #12346',
      transferIntent: 'Order inquiry',
      journeyStatus: 'Inquiry resolved',
      value: 1500.50,
      segment: 'pharmaceutical',
      rating: '5 stars',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      externalId: 'TB002',
      cnpj: '98.765.432/0001-10',
      sessionBot: 'session-bot-002',
      email: 'customer2@example.com',
      origin: 'telegram',
      destination: 'specialist',
      telephone: '+5511888888888',
      chatBot: 'Customer: I have questions about vaccines\nBot: I\'ll transfer you to our vaccine specialist.',
      chatHuman: 'Specialist: I can help you with vaccine information. What specific vaccines are you interested in?',
      startedAt: new Date('2024-01-16 14:15:00'),
      finishedAt: new Date('2024-01-16 14:30:00'),
      orderQuery: null,
      budget: null,
      newOrder: null,
      vaccine: 'Customer interested in flu vaccine and COVID-19 booster',
      purchaseConversion: null,
      orders: null,
      transferIntent: 'Vaccine consultation',
      journeyStatus: 'Specialist consultation',
      value: null,
      segment: 'healthcare',
      rating: '4 stars',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await knex('transbordo').insert(sampleTransbordo);
  console.log('✅ Sample transbordo created successfully!');
  console.log(`📊 Total sample transbordo records created: ${sampleTransbordo.length}`);
}
