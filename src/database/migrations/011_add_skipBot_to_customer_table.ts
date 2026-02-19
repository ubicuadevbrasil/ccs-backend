import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('customer', (table) => {
    table.boolean('skipBot').notNullable().defaultTo(false);
    
    // Index for better query performance when filtering by skipBot
    table.index(['skipBot']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('customer', (table) => {
    table.dropIndex(['skipBot']);
    table.dropColumn('skipBot');
  });
}

