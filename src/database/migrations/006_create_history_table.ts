import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('sessionId').notNullable(); // Session identifier for tracking interactions
    table.uuid('userId').references('id').inTable('user').onDelete('CASCADE');
    table.uuid('customerId').references('id').inTable('customer').onDelete('CASCADE');
    table.uuid('tabulationId').references('id').inTable('tabulation').onDelete('CASCADE');
    table.text('observations'); // Internal notes/observations about the interaction
    table.enum('platform', ['whatsapp', 'telegram', 'instagram', 'facebook', 'other']).notNullable().defaultTo('whatsapp');
    table.timestamp('startedAt').notNullable(); // When the interaction started
    table.timestamp('attendedAt'); // When the customer was attended (nullable)
    table.timestamp('finishedAt'); // When the interaction finished (nullable)
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes for better performance
    table.index(['sessionId']);
    table.index(['userId']);
    table.index(['customerId']);
    table.index(['tabulationId']);
    table.index(['platform']);
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
