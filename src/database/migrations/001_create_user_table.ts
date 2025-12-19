import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user', (table) => {
    table.string('id', 36).primary();
    table.text('login').notNullable().unique();
    table.text('password').notNullable();
    table.text('name').notNullable();
    table.text('email').nullable().unique();
    table.text('contact').nullable().unique();
    table.text('profilePicture');
    table.enum('status', ['active', 'inactive']).notNullable().defaultTo('active');
    table.enum('profile', ['admin', 'supervisor', 'operator']).notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('loginAt').nullable(); // When the user last logged in
    table.timestamp('logoutAt').nullable(); // When the user last logged out
    table.timestamp('lastActivityAt').nullable(); // When the user was last active
    
    // Indexes for better performance
    table.index(['login']);
    table.index(['email']);
    table.index(['contact']);
    table.index(['status']);
    table.index(['profile']);
    table.index(['lastActivityAt']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user');
} 