import { Knex } from 'knex';
import * as dotenv from 'dotenv';
import externalKnexConfig from '../../../knexfile.external';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

/**
 * Helper function to validate and generate UUID
 */
function validateAndGenerateId(id: any): string {
  // Check if the ID is a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (id && typeof id === 'string' && uuidRegex.test(id)) {
    return id;
  }
  
  // If ID is invalid (like "-1"), generate a new UUID
  console.log(`⚠️  Invalid ID found: "${id}". Generating new UUID.`);
  return uuidv4();
}

export async function seed(knex: Knex): Promise<void> {
  console.log('🌱 Starting transfer seed...');
  
  // Clear existing data
  await knex('transfer').del();

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
    console.log('⚠️  Cannot connect to external database. Skipping seed.');
    console.log(`Error: ${error.message}`);
    return;
  }

  try {
    // Get data from external database using the provided query
    const externalTransfers = await externalKnex.raw(`
      SELECT 
        st.id,
        st.descricao AS name,
        NULL AS description,
        st.pedido AS "order",
        (CASE WHEN st.status = 0 THEN 'inactive' ELSE 'active' END) AS status
      FROM tab_statusen st
    `);

    // Transform external data to match our transfer table structure
    const transfers = externalTransfers[0].map((row: any) => ({
      id: validateAndGenerateId(row.id),
      name: row.name,
      description: row.description,
      order: Boolean(row.order),
      status: row.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Insert transfers
    await knex('transfer').insert(transfers);

    console.log('✅ Transfer seeded successfully!');
    console.log(`📊 Total transfers created: ${transfers.length}`);
    console.log('📋 Transfers by status:');
    console.log(`   - Active: ${transfers.filter(t => t.status === 'active').length}`);
    console.log(`   - Inactive: ${transfers.filter(t => t.status === 'inactive').length}`);
    console.log('📋 Transfers by order:');
    console.log(`   - With order: ${transfers.filter(t => t.order === true).length}`);
    console.log(`   - Without order: ${transfers.filter(t => t.order === false).length}`);
    
  } catch (error) {
    console.error('❌ Error during transfer seed:', error);
    throw error;
  } finally {
    // Close external connection
    await externalKnex.destroy();
    console.log('🔌 External database connection closed');
  }
}
