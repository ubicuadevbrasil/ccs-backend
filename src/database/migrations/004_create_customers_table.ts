import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('customers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('remoteJid').notNullable().unique(); // WhatsApp ID (phone number only)
    table.text('pushName'); // Display name from WhatsApp
    table.text('profilePicUrl'); // Profile picture URL
    table.text('email'); // Optional email
    table.text('cpf'); // Optional CPF (Brazilian individual tax ID)
    table.text('cnpj'); // Optional CNPJ (Brazilian company tax ID)
    table.integer('priority').defaultTo(0); // Priority level for customer service
    table.boolean('isGroup').notNullable().defaultTo(false);
    table.boolean('isSaved').notNullable().defaultTo(false);
    table.enum('type', ['contact']).notNullable().defaultTo('contact');
    table.enum('status', ['active', 'inactive', 'blocked']).notNullable().defaultTo('active');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes for better performance
    table.index(['remoteJid']);
    table.index(['type']);
    table.index(['status']);
    table.index(['priority']);
    table.index(['email']);
    table.index(['cpf']);
    table.index(['cnpj']);
    table.index(['isGroup']);
    table.index(['isSaved']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('customers');
} 