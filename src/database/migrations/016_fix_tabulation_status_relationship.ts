import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // First, remove the incorrect subReason field from tabulationStatus
  await knex.schema.alterTable('tabulationStatus', (table) => {
    table.dropColumn('subReason');
  });

  // Remove the index on subReason if it exists (check first)
  try {
    await knex.raw('DROP INDEX IF EXISTS tabulationstatus_subreason_index');
  } catch (error) {
    // Index doesn't exist, which is fine
    console.log('Index tabulationstatus_subreason_index does not exist, skipping...');
  }

  // Ensure tabulationStatusSub has the correct tabulationStatusId field
  // (This should already exist from migration 015, but let's make sure)
  const hasColumn = await knex.schema.hasColumn('tabulationStatusSub', 'tabulationStatusId');
  if (!hasColumn) {
    await knex.schema.alterTable('tabulationStatusSub', (table) => {
      table.uuid('tabulationStatusId').references('id').inTable('tabulationStatus');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Restore the old structure
  await knex.schema.alterTable('tabulationStatus', (table) => {
    table.uuid('subReason').references('id').inTable('tabulationStatusSub');
  });

  await knex.schema.alterTable('tabulationStatus', (table) => {
    table.index(['subReason']);
  });

  // Remove the tabulationStatusId field from tabulationStatusSub
  await knex.schema.alterTable('tabulationStatusSub', (table) => {
    table.dropColumn('tabulationStatusId');
  });
}
