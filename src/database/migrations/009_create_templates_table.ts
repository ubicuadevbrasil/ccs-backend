import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('templates', (table) => {
    table.string('id', 36).primary();
    table.string('templateCode', 100).notNullable().unique();
    table.jsonb('accounts').notNullable(); // Array of account strings
    table.jsonb('buttonSample').notNullable().defaultTo('[]'); // Array of button objects
    table.string('category', 50).notNullable(); // MARKETING, UTILITY, etc.
    table.text('content').notNullable();
    table.string('status', 1).notNullable(); // A, R, P
    table.string('statusDescription', 50).notNullable();
    table.jsonb('variableSample').notNullable().defaultTo('{}'); // Object with variable samples
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes for better performance
    table.index(['templateCode']);
    table.index(['status']);
    table.index(['category']);
    table.index(['createdAt']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('templates');
}

