import { Knex } from 'knex';
import * as dotenv from 'dotenv';
import externalKnexConfig from '../../../knexfile.external';
import * as crypto from 'crypto';

// Load environment variables
dotenv.config();

/**
 * Interface for external transfer data from MySQL tab_transbordo
 */
interface ExternalTransferData {
  sessionBot: string;
  origem: string | null;
  destino: string | null;
  novo_pedido: boolean | null;
  consultar_pedido: boolean | null;
  orcamento: boolean | null;
  vacina: boolean | null;
  convert_compra: boolean | null;
  transbordo_intent: string | null;
}

/**
 * Interface for the final transfer record to be inserted
 */
interface TransferRecord {
  id: string;
  historyId: string;
  newOrder: boolean;
  checkOrder: boolean;
  budget: boolean;
  vaccine: boolean;
  hasOrder: boolean;
  intent: string | null;
  createdAt: Date;
  updatedAt: Date;
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
 * Helper function to find history record by sessionBot or sessionId
 */
async function findHistoryBySessionBot(knex: Knex, sessionBot: string): Promise<string | null> {
  try {
    if (!sessionBot) return null;

    console.log(`🔍 Looking for history with sessionBot: ${sessionBot}`);

    // First try to find by sessionBot
    let history = await knex('history')
      .where('sessionBot', sessionBot)
      .first();

    if (history) {
      console.log(`✅ Found history by sessionBot: ${history.sessionId} (ID: ${history.id})`);
      return history.id;
    }

    // If not found by sessionBot, try to find by sessionId
    console.log(`🔍 No history found by sessionBot, trying sessionId: ${sessionBot}`);
    history = await knex('history')
      .where('sessionId', sessionBot)
      .first();

    if (history) {
      console.log(`✅ Found history by sessionId: ${history.sessionId} (ID: ${history.id})`);
      return history.id;
    } else {
      console.log(`❌ No history found with sessionBot or sessionId: ${sessionBot}`);
      return null;
    }
  } catch (error) {
    console.error('Error finding history:', error);
    return null;
  }
}

/**
 * Helper function to map origin value according to business rules
 */
function mapOrigin(origem: string | null): string | null {
  if (!origem) return 'whatsapp';
  
  const origemLower = origem.toLowerCase();
  if (origemLower === 'wbot' || origemLower === 'null') {
    return 'whatsapp';
  }
  
  return 'chatweb';
}

/**
 * Helper function to map destiny value according to business rules
 */
function mapDestiny(destino: string | null): string | null {
  if (!destino) return 'human';
  
  const destinoLower = destino.toLowerCase();
  if (destinoLower === 'null' || destinoLower === 'human') {
    return 'human';
  }
  
  return 'bot';
}

/**
 * Helper function to update history record with transfer data (origin and destiny)
 */
async function updateHistoryWithTransferData(knex: Knex, historyId: string, external: ExternalTransferData): Promise<void> {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Map origin and destiny according to business rules
    const mappedOrigin = mapOrigin(external.origem);
    const mappedDestiny = mapDestiny(external.destino);

    updateData.origin = mappedOrigin;
    updateData.destiny = mappedDestiny;

    await knex('history')
      .where('id', historyId)
      .update(updateData);
    
    console.log(`✅ Updated history ${historyId} with origin: ${mappedOrigin} (from: ${external.origem}), destiny: ${mappedDestiny} (from: ${external.destino})`);
  } catch (error) {
    console.error('Error updating history with transfer data:', error);
  }
}

export async function seed(knex: Knex): Promise<void> {
  console.log('🌱 Starting transfer seed...');

  // Clear existing transfer data
  await knex('transfer').del();
  console.log('🗑️  Cleared existing transfer data');

  // Create external database connection (MySQL)
  const environment = process.env.NODE_ENV || 'development';
  const externalConfig = externalKnexConfig[environment];
  
  if (!externalConfig) {
    console.log('⚠️  External database configuration not found. Skipping transfer seed.');
    return;
  }

  // Create external knex instance
  const externalKnex = require('knex')(externalConfig);
  
  try {
    // Test the external connection
    await externalKnex.raw('SELECT 1');
    console.log('✅ External database connection established');
  } catch (error) {
    console.log('⚠️  Cannot connect to external database. Skipping transfer seed.');
    console.log(`Error: ${error.message}`);
    return;
  }

  try {
    // Step 1: Fetch external transfer data from MySQL tab_transbordo
    console.log('📡 Fetching external transfer data from MySQL tab_transbordo...');
    
    const result = await externalKnex.raw(`
      SELECT 
        t.sessionBot,
        t.origem,
        t.destino,
        t.novo_pedido,
        t.consultar_pedido,
        t.orcamento,
        t.vacina,
        t.convert_compra,
        t.transbordo_intent
      FROM tab_transbordo t
      WHERE t.sessionBot IS NOT NULL
    `);
    
    const externalData: ExternalTransferData[] = result[0];
    
    console.log(`📊 Found ${externalData.length} external transfer records`);

    if (externalData.length === 0) {
      console.log('⚠️  No external transfer data found. Skipping transfer seed.');
      return;
    }

    // Step 2: Process external records in batches
    const batchSize = parseInt(process.env.TRANSFER_BATCH_SIZE || '100');
    let totalProcessed = 0;
    let totalInserted = 0;
    const startTime = Date.now();
    
    console.log(`📦 Processing ${externalData.length} transfer records in batches of ${batchSize}...`);
    
    for (let i = 0; i < externalData.length; i += batchSize) {
      const batch = externalData.slice(i, i + batchSize);
      const transfersToInsert: TransferRecord[] = [];
      
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(externalData.length / batchSize);
      const progressPercent = ((i / externalData.length) * 100).toFixed(1);
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records) - ${progressPercent}% complete...`);
      
      for (const externalRecord of batch) {
        try {
          console.log(`🔍 Processing transfer record ${totalProcessed + 1}/${externalData.length}:`, {
            sessionBot: externalRecord.sessionBot,
            origem: externalRecord.origem,
            destino: externalRecord.destino,
            novo_pedido: externalRecord.novo_pedido,
            consultar_pedido: externalRecord.consultar_pedido,
            orcamento: externalRecord.orcamento,
            vacina: externalRecord.vacina,
            convert_compra: externalRecord.convert_compra,
            transbordo_intent: externalRecord.transbordo_intent
          });
          
          // Step 2a: Find history record by sessionBot
          const historyId = await findHistoryBySessionBot(knex, externalRecord.sessionBot);
          
          if (!historyId) {
            console.log(`⚠️  No history found for sessionBot ${externalRecord.sessionBot}, skipping transfer`);
            totalProcessed++;
            continue;
          }
          
          // Step 2b: Update history record with origin and destiny
          await updateHistoryWithTransferData(knex, historyId, externalRecord);
          
          // Step 2c: Transform and combine data
          const transferRecord = transformToTransferRecord(externalRecord, historyId);
          transfersToInsert.push(transferRecord);
          
          console.log(`✅ Processed transfer record ${externalRecord.sessionBot} - History: ${historyId}`);
          totalProcessed++;
        } catch (error) {
          console.error(`❌ Error processing transfer record ${externalRecord.sessionBot}:`, error);
          totalProcessed++;
        }
      }

      // Step 3: Insert batch into the database
      if (transfersToInsert.length > 0) {
        console.log(`💾 Inserting batch of ${transfersToInsert.length} transfer records into database...`);
        await knex('transfer').insert(transfersToInsert);
        totalInserted += transfersToInsert.length;
        console.log(`✅ Batch inserted successfully! Total inserted: ${totalInserted}`);
      }
    }
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000; // in seconds
    
    console.log('✅ Transfer seeded successfully!');
    console.log(`📊 Total transfer records processed: ${totalProcessed}`);
    console.log(`📊 Total transfer records inserted: ${totalInserted}`);
    console.log(`📊 Batches processed: ${Math.ceil(externalData.length / batchSize)}`);
    console.log(`⏱️  Total processing time: ${totalTime.toFixed(2)} seconds`);
    console.log(`📈 Average time per record: ${(totalTime / totalProcessed).toFixed(3)} seconds`);
    console.log(`📈 Records per second: ${(totalProcessed / totalTime).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error during transfer seed:', error);
  } finally {
    // Close external database connection
    if (externalKnex) {
      await externalKnex.destroy();
      console.log('🔌 External database connection closed');
    }
  }
}

/**
 * Transforms external transfer data into transfer record
 */
function transformToTransferRecord(
  external: ExternalTransferData, 
  historyId: string
): TransferRecord {
  const now = new Date();
  
  // Generate UUID for id field
  const transferId = crypto.randomUUID();

  return {
    id: transferId,
    historyId,
    newOrder: external.novo_pedido || false,
    checkOrder: external.consultar_pedido || false,
    budget: external.orcamento || false,
    vaccine: external.vacina || false,
    hasOrder: external.convert_compra || false,
    intent: safeParseText(external.transbordo_intent),
    createdAt: now,
    updatedAt: now,
  };
}
