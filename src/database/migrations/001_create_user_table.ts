import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('login').notNullable().unique();
    table.text('password').notNullable();
    table.text('name').notNullable();
    table.text('email').notNullable().unique();
    table.text('contact').notNullable().unique();
    table.text('profilePicture');
    table.enum('status', ['active', 'inactive']).notNullable().defaultTo('active');
    table.enum('profile', ['admin', 'supervisor', 'operator']).notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes for better performance
    table.index(['login']);
    table.index(['email']);
    table.index(['contact']);
    table.index(['status']);
    table.index(['profile']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user');
} 