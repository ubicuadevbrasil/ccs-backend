import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('history', (table) => {
    table.text('donorCode').nullable(); // Optional Donor Code
    table.index(['donorCode']); // Index for better performance
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('history', (table) => {
    table.dropIndex(['donorCode']);
    table.dropColumn('donorCode');
  });
}

