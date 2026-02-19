import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('history', (table) => {
    table.string('id', 36).primary();
    table.string('sessionId', 36).notNullable().unique(); // Session identifier for tracking interactions
    table.string('protocol', 255).nullable(); // Friendly session identifier (e.g., 20251218175106819)
    table.string('userId', 36).references('id').inTable('user').onDelete('CASCADE');
    table.string('customerId', 36).references('id').inTable('customer').onDelete('CASCADE');
    table.string('tabulationId', 36).references('id').inTable('tabulation').onDelete('CASCADE');
    table.text('observations'); // Internal notes/observations about the interaction
    table.enum('platform', ['whatsapp', 'telegram', 'instagram', 'facebook', 'other']).notNullable().defaultTo('whatsapp');
    table.enum('direction', ['inbound', 'outbound']).notNullable().defaultTo('inbound');
    table.timestamp('startedAt').notNullable(); // When the interaction started
    table.timestamp('attendedAt'); // When the customer was attended (nullable)
    table.timestamp('finishedAt'); // When the interaction   finished (nullable)
    table.enum('origin', ['whatsapp', 'chatweb', 'other']).notNullable().defaultTo('whatsapp'); // Where the chat started (whatsapp, chatweb, etc.)
    table.enum('destiny', ['bot', 'human', 'other']).notNullable().defaultTo('bot'); // Who finished the journey (bot, human, etc.)
    table.string('segment', 255).nullable(); // Customer segment
    table.integer('review').nullable(); // Customer reviews
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    // Indexes for better performance
    table.index(['sessionId']);
    table.index(['protocol']);
    table.index(['userId']);
    table.index(['customerId']);
    table.index(['platform']);
    table.index(['direction']);
    table.index(['startedAt']);
    table.index(['attendedAt']);
    table.index(['finishedAt']);
    table.index(['userId', 'customerId']); // Composite index for user-customer interactions
    table.index(['sessionId', 'platform']); // Composite index for session-platform queries
    table.index(['origin', 'destiny']); // Composite index for common queries
    table.index(['segment']);
    table.index(['review']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('history');
}
