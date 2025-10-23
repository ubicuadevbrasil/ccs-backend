import { Knex } from 'knex';
import * as dotenv from 'dotenv';
import externalKnexConfig from '../../../knexfile.external';
import { TabulationStatus } from '../../modules/tabulation/entities/tabulation.entity';

// Load environment variables
dotenv.config();

/**
 * Interface for external tabulation data from MySQL tab_statusen
 */
interface ExternalTabulationData {
  id: string | number;
  descricao: string;
  pedido: number;
  status: number;
}

/**
 * Interface for the final tabulation record to be inserted
 */
interface TabulationRecord {
  id: string;
  name: string;
  description: string | null;
  status: TabulationStatus;
  orders: boolean;
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
 * Helper function to convert status number to TabulationStatus enum
 */
function convertStatus(status: number): TabulationStatus {
  return status === 0 ? TabulationStatus.INACTIVE : TabulationStatus.ACTIVE;
}

/**
 * Helper function to convert pedido to boolean
 */
function convertPedidoToBoolean(pedido: number): boolean {
  return pedido === 1;
}

export async function seed(knex: Knex): Promise<void> {
  console.log('🌱 Starting tabulation external seed...');

  // Clear existing data (optional - comment out if you want to keep existing tabulations)
  // await knex('tabulation').del();
  console.log('📋 Note: Existing tabulation data will be preserved (no deletion performed)');

  // Create external database connection (MySQL)
  const environment = process.env.NODE_ENV || 'development';
  const externalConfig = externalKnexConfig[environment];
  
  if (!externalConfig) {
    console.log('⚠️  External database configuration not found. Skipping tabulation external seed.');
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
    // Step 1: Fetch external data from MySQL tab_statusen table
    console.log('📡 Fetching external data from MySQL tab_statusen table...');
    const result = await externalKnex.raw(`
      SELECT 
        st.id,
        st.descricao,
        st.pedido,
        st.status
      FROM tab_statusen st
    `);

    // Extract the actual data from knex.raw result
    const externalData: ExternalTabulationData[] = result[0];
    
    console.log(`📊 Found ${externalData.length} external tabulation records`);

    if (externalData.length === 0) {
      console.log('⚠️  No external data found. Skipping seed.');
      return;
    }

    // Step 2: Process external records in batches
    const batchSize = parseInt(process.env.TABULATION_BATCH_SIZE || '50');
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalSkipped = 0;
    const startTime = Date.now();
    
    console.log(`📦 Processing ${externalData.length} records in batches of ${batchSize}...`);
    
    for (let i = 0; i < externalData.length; i += batchSize) {
      const batch = externalData.slice(i, i + batchSize);
      const tabulationsToInsert: TabulationRecord[] = [];
      
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(externalData.length / batchSize);
      const progressPercent = ((i / externalData.length) * 100).toFixed(1);
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records) - ${progressPercent}% complete...`);
      
      for (const externalRecord of batch) {
        try {
          console.log(`🔍 Processing tabulation ${totalProcessed + 1}/${externalData.length}:`, {
            id: externalRecord.id,
            descricao: externalRecord.descricao,
            pedido: externalRecord.pedido,
            status: externalRecord.status,
          });
          
          // Step 2a: Transform and validate data
          const tabulationRecord = await transformToTabulationRecord(externalRecord, knex);
          
          if (tabulationRecord) {
            tabulationsToInsert.push(tabulationRecord);
            console.log(`✅ Processed tabulation record for ${tabulationRecord.name}`);
          } else {
            totalSkipped++;
            console.log(`⏭️  Skipped invalid tabulation record`);
          }
          
          totalProcessed++;
        } catch (error) {
          console.error(`❌ Error processing tabulation record:`, error);
          totalSkipped++;
          totalProcessed++;
        }
      }

      // Step 3: Insert batch into the database
      if (tabulationsToInsert.length > 0) {
        console.log(`💾 Inserting batch of ${tabulationsToInsert.length} tabulation records into database...`);
        
        // Check for duplicates before inserting
        const uniqueTabulations = await filterDuplicateTabulations(tabulationsToInsert, knex);
        
        if (uniqueTabulations.length > 0) {
          await knex('tabulation').insert(uniqueTabulations);
          totalInserted += uniqueTabulations.length;
          console.log(`✅ Batch inserted successfully! Total inserted: ${totalInserted}`);
        } else {
          console.log(`⏭️  All tabulations in batch were duplicates, skipping insertion`);
        }
      }
    }
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000; // in seconds
    
    console.log('✅ Tabulation external seed completed successfully!');
    console.log(`📊 Total tabulation records processed: ${totalProcessed}`);
    console.log(`📊 Total tabulation records inserted: ${totalInserted}`);
    console.log(`📊 Total tabulation records skipped: ${totalSkipped}`);
    console.log(`📊 Batches processed: ${Math.ceil(externalData.length / batchSize)}`);
    console.log(`⏱️  Total processing time: ${totalTime.toFixed(2)} seconds`);
    console.log(`📈 Average time per record: ${(totalTime / totalProcessed).toFixed(3)} seconds`);
    console.log(`📈 Records per second: ${(totalProcessed / totalTime).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error during tabulation external seed:', error);
  } finally {
    // Close external database connection
    if (externalKnex) {
      await externalKnex.destroy();
      console.log('🔌 External database connection closed');
    }
  }
}

/**
 * Transforms external data into tabulation record
 */
async function transformToTabulationRecord(external: ExternalTabulationData, knex: Knex): Promise<TabulationRecord | null> {
  const now = new Date();
  
  // Validate required fields
  if (!external.id || !external.descricao) {
    console.log('⚠️  Missing required fields (id or descricao), skipping record');
    return null;
  }
  
  // Use the external ID directly
  const externalId = String(external.id);

  return {
    id: externalId,
    name: safeParseText(external.descricao) || 'Unknown Tabulation',
    description: null, // As specified in the SQL query
    status: convertStatus(external.status),
    orders: convertPedidoToBoolean(external.pedido),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Filters out duplicate tabulations based on ID
 */
async function filterDuplicateTabulations(tabulations: TabulationRecord[], knex: Knex): Promise<TabulationRecord[]> {
  if (tabulations.length === 0) return [];
  
  const ids = tabulations.map(t => t.id);
  
  // Check which IDs already exist
  const existingTabulations = await knex('tabulation')
    .select('id')
    .whereIn('id', ids);
  
  const existingIds = new Set(existingTabulations.map(t => t.id));
  
  // Filter out duplicates based on ID
  return tabulations.filter(tabulation => 
    !existingIds.has(tabulation.id)
  );
}
