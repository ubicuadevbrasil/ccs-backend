import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('sessionId').notNullable(); // Session identifier for tracking interactions
    table.uuid('userId').references('id').inTable('user').onDelete('CASCADE');
    table.uuid('customerId').references('id').inTable('customer').onDelete('CASCADE');
    table.uuid('transferId').references('id').inTable('transfer').onDelete('CASCADE');
    table.text('observations'); // Internal notes/observations about the interaction
    table.enum('platform', ['whatsapp', 'telegram', 'instagram', 'facebook', 'other']).notNullable().defaultTo('whatsapp');
    table.timestamp('startedAt').notNullable(); // When the interaction started
    table.timestamp('attendedAt'); // When the customer was attended (nullable)
    table.timestamp('finishedAt'); // When the interaction finished (nullable)
    table.string('origin', 255).nullable(); // Where the chat started (whatsapp, chatweb, etc.)
    table.string('destiny', 255).nullable(); // Who finished the journey (bot, human, etc.)
    table.string('segment', 255).nullable(); // Customer segment
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes for better performance
    table.index(['sessionId']);
    table.index(['userId']);
    table.index(['customerId']);
    table.index(['transferId']);
    table.index(['platform']);
    table.index(['startedAt']);
    table.index(['attendedAt']);
    table.index(['finishedAt']);
    table.index(['origin']);
    table.index(['destiny']);
    table.index(['segment']);
    table.index(['userId', 'customerId']); // Composite index for user-customer interactions
    table.index(['sessionId', 'platform']); // Composite index for session-platform queries
    table.index(['origin', 'destiny']); // Composite index for common queries
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('history');
}
