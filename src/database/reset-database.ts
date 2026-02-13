import * as dotenv from 'dotenv';
import knex from 'knex';
import config from '../../knexfile';

dotenv.config();

/**
 * Reset database by dropping all tables and re-running migrations
 * WARNING: This will delete all data!
 */
async function resetDatabase(): Promise<void> {
  const environment = process.env.NODE_ENV || 'development';
  const dbConfig = config[environment];
  const db = knex(dbConfig);

  try {
    console.log(`Resetting database for environment: ${environment}`);
    
    // Get all table names
    const tables = await db.raw(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename != 'pg_stat_statements'
    `);

    const tableNames = tables.rows.map((row: any) => row.tablename);

    if (tableNames.length === 0) {
      console.log('No tables found to drop.');
    } else {
      console.log(`Found ${tableNames.length} tables to drop:`, tableNames);
      
      // Disable foreign key checks temporarily (PostgreSQL uses CASCADE)
      // Drop all tables with CASCADE to handle foreign key constraints
      for (const tableName of tableNames) {
        console.log(`Dropping table: ${tableName}`);
        await db.raw(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
      }
      
      console.log('All tables dropped successfully.');
    }

    // Run migrations
    console.log('Running migrations...');
    await db.migrate.latest();
    console.log('Migrations completed successfully!');

  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('Database reset completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database reset failed:', error);
      process.exit(1);
    });
}

export { resetDatabase };

