import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('login').notNullable().unique();
    table.text('password').notNullable();
    table.text('name').notNullable();
    table.text('email').notNullable().unique();
    table.text('contact').notNullable().unique();
    table.text('profilePicture');
    table.enum('status', ['Active', 'Inactive']).notNullable().defaultTo('Active');
    table.enum('profile', ['Admin', 'Supervisor', 'Operator']).notNullable();
    table.enum('department', ['Personal', 'Fiscal', 'Accounting', 'Financial']).notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes for better performance
    table.index(['login']);
    table.index(['email']);
    table.index(['contact']);
    table.index(['status']);
    table.index(['profile']);
    table.index(['department']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
} 