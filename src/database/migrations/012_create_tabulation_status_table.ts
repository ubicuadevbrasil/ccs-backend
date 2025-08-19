import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('tabulationStatus');
  if (hasTable) {
    console.log('Table tabulationStatus already exists, skipping...');
    return;
  }
  
  return knex.schema.createTable('tabulationStatus', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('description').notNullable();
    table.uuid('subReason').references('id').inTable('tabulationStatusSub');
    
    // Indexes for better performance
    table.index(['description']);
    table.index(['subReason']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('tabulationStatus');
}
