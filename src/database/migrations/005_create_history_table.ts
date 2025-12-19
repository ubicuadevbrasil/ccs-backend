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
    table.timestamp('finishedAt'); // When the interaction finished (nullable)
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
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('history');
}
