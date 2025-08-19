import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add active field to users table
  await knex.schema.alterTable('users', (table) => {
    table.boolean('active').notNullable().defaultTo(true);
  });

  // Add index for better performance on active field
  await knex.schema.alterTable('users', (table) => {
    table.index(['active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove index
  await knex.schema.alterTable('users', (table) => {
    table.dropIndex(['active']);
  });

  // Remove active field
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('active');
  });
}
