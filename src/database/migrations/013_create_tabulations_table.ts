import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('tabulations');
  if (hasTable) {
    console.log('Table tabulations already exists, skipping...');
    return;
  }
  
  return knex.schema.createTable('tabulations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('sessionId').references('sessionId').inTable('queues').notNullable();
    table.uuid('tabulatedBy').references('id').inTable('users').notNullable();
    table.timestamp('tabulatedAt').defaultTo(knex.fn.now());
    table.uuid('tabulationId').references('id').inTable('tabulationStatusSub').notNullable();
    
    // Indexes for better performance
    table.index(['sessionId']);
    table.index(['tabulatedBy']);
    table.index(['tabulatedAt']);
    table.index(['tabulationId']);
    table.index(['sessionId', 'tabulatedAt']); // For session history
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('tabulations');
}
