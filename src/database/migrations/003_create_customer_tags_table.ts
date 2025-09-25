import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('customerTags', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('customerId').references('id').inTable('customer').onDelete('CASCADE');
    
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
