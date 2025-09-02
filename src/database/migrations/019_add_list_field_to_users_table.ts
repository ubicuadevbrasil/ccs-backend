import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add list field to users table
  await knex.schema.alterTable('users', (table) => {
    table.boolean('list').notNullable().defaultTo(true);
  });

  // Add index for better performance on list field
  await knex.schema.alterTable('users', (table) => {
    table.index(['list']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove index
  await knex.schema.alterTable('users', (table) => {
    table.dropIndex(['list']);
  });

  // Remove list field
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('list');
  });
}
