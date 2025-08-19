import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('groupParticipants', (table) => {
    // Add profile picture field
    table.text('profilePicture'); // Profile picture URL from Evolution API
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('groupParticipants', (table) => {
    table.dropColumn('profilePicture');
  });
} 