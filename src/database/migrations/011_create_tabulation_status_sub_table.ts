import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('tabulationStatusSub');
  if (hasTable) {
    console.log('Table tabulationStatusSub already exists, skipping...');
    return;
  }
  
  return knex.schema.createTable('tabulationStatusSub', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('description').notNullable();
    
    // Indexes for better performance
    table.index(['description']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('tabulationStatusSub');
}
