import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('customerTags', (table) => {
    table.string('id', 36).primary();
    table.string('customerId', 36).references('id').inTable('customer').onDelete('CASCADE');
    
    table.text('tag').notNullable(); // The actual tag value (e.g., 'vip', 'premium', 'new-customer')
    
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.unique(['customerId', 'tag']); // Prevent duplicate tags per customer
    
    table.index(['customerId']);
    table.index(['tag']);
    table.index(['createdAt']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('customerTags');
}
