import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Remove the foreign key constraint from sessionId
  return knex.schema.alterTable('messages', (table) => {
    // Drop the existing foreign key constraint
    table.dropForeign(['sessionId']);
    
    // The column definition remains the same, just without the foreign key constraint
    // This allows sessionId to be any UUID, not just those that exist in the queues table
  });
}

export async function down(knex: Knex): Promise<void> {
  // Restore the foreign key constraint
  return knex.schema.alterTable('messages', (table) => {
    table.foreign('sessionId').references('id').inTable('queues');
  });
} 