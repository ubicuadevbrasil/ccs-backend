import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add tabulationStatusId field to tabulationStatusSub table
  await knex.schema.alterTable('tabulationStatusSub', (table) => {
    table.uuid('tabulationStatusId').references('id').inTable('tabulationStatus');
  });

  // Add index for better performance on the foreign key
  await knex.schema.alterTable('tabulationStatusSub', (table) => {
    table.index(['tabulationStatusId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove index first
  await knex.schema.alterTable('tabulationStatusSub', (table) => {
    table.dropIndex(['tabulationStatusId']);
  });

  // Remove the foreign key column
  await knex.schema.alterTable('tabulationStatusSub', (table) => {
    table.dropColumn('tabulationStatusId');
  });
}