import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add active field to tabulationStatus table
  await knex.schema.alterTable('tabulationStatus', (table) => {
    table.boolean('active').notNullable().defaultTo(true);
  });

  // Add active field to tabulationStatusSub table
  await knex.schema.alterTable('tabulationStatusSub', (table) => {
    table.boolean('active').notNullable().defaultTo(true);
  });

  // Add indexes for better performance on active field
  await knex.schema.alterTable('tabulationStatus', (table) => {
    table.index(['active']);
  });

  await knex.schema.alterTable('tabulationStatusSub', (table) => {
    table.index(['active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove indexes
  await knex.schema.alterTable('tabulationStatus', (table) => {
    table.dropIndex(['active']);
  });

  await knex.schema.alterTable('tabulationStatusSub', (table) => {
    table.dropIndex(['active']);
  });

  // Remove active fields
  await knex.schema.alterTable('tabulationStatus', (table) => {
    table.dropColumn('active');
  });

  await knex.schema.alterTable('tabulationStatusSub', (table) => {
    table.dropColumn('active');
  });
}
