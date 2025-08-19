import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('messageTemplates', (table) => {
    // Primary identification
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Template content
    table.text('message').notNullable();
    
    // Template type
    table.enum('type', [
      'greeting',           // Welcome messages
      'follow_up',          // Follow-up messages
      'reminder',           // Reminder messages
      'support',            // Customer support messages
      'marketing',          // Marketing/promotional messages
      'notification',       // General notifications
      'custom'              // Custom template type
    ]).notNullable();
    
    // Timestamps
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index(['type']);
    table.index(['createdAt']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('messageTemplates');
}
