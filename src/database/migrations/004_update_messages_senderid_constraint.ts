import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Remove the foreign key constraint from senderId
  return knex.schema.alterTable('messages', (table) => {
    // Drop the existing foreign key constraint
    table.dropForeign(['senderId']);
    
    // The column definition remains the same, just without the foreign key constraint
    // This allows senderId to reference both users (operators) and customers
  });
}

export async function down(knex: Knex): Promise<void> {
  // Restore the foreign key constraint (only to users table)
  return knex.schema.alterTable('messages', (table) => {
    table.foreign('senderId').references('id').inTable('users');
  });
} 