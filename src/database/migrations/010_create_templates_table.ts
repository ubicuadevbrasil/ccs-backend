import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('templates', (table) => {
    table.string('id', 36).primary();
    table.string('name', 255).notNullable(); // Template name (e.g. sample_issue_resolution)
    table.string('language', 20).notNullable(); // Language code (e.g. en)
    table
      .string('status', 20)
      .notNullable(); // APPROVED, REJECTED, IN_APPEAL, PENDING, PENDING_DELETION, DELETED, DISABLED, LOCKED
    table
      .string('category', 20)
      .notNullable(); // UTILITY, AUTHENTICATION, MARKETING
    table.string('previous_category', 20).nullable(); // Previous category if template was re-categorized
    table.jsonb('components').notNullable().defaultTo('[]'); // Array of HEADER, BODY, FOOTER, BUTTONS components
    table.jsonb('accounts').notNullable().defaultTo('[]'); // App-specific: WABA IDs that have this template

    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    // Indexes for better performance
    table.unique(['name', 'language']);
    table.index(['name']);
    table.index(['language']);
    table.index(['status']);
    table.index(['category']);
    table.index(['createdAt']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('templates');
}
