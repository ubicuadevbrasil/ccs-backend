import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('queues', (table) => {
    // Add customer reference
    table.uuid('customerId').references('id').inTable('customers').onDelete('CASCADE');
    
    // Remove redundant customer fields
    table.dropColumn('customerPhone');
    table.dropColumn('customerName');
    
    // Add index for customer relationship
    table.index(['customerId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('queues', (table) => {
    // Remove customer reference
    table.dropColumn('customerId');
    
    // Restore redundant customer fields
    table.text('customerPhone').notNullable();
    table.text('customerName');
    
    // Remove customer index
    table.dropIndex(['customerId']);
  });
} 