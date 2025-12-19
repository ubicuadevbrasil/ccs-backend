import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('tabulation', (table) => {
    table.string('id', 36).primary();
    table.text('name').notNullable();
    table.text('description');
    table.enum('status', ['active', 'inactive']).notNullable().defaultTo('active');
    table.boolean('effective').notNullable().defaultTo(false);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes for better performance
    table.index(['name']);
    table.index(['status']);
    table.index(['effective']);
    table.index(['createdAt']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('tabulation');
}