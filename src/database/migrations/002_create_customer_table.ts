import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('customer', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('platformId').notNullable().unique(); // Platform-specific ID (WhatsApp phone, Telegram user_id, etc.)
    table.text('pushName'); // Display name from platform
    table.text('name'); // customer name
    table.text('profilePicUrl'); // Profile picture URL
    table.text('contact'); // Platform phone number (WhatsApp, Telegram, Instagram, Facebook, etc.)
    table.text('email'); // Optional email
    table.text('cpf'); // Optional CPF (Brazilian individual tax ID)
    table.text('cnpj'); // Optional CNPJ (Brazilian company tax ID)
    table.integer('priority').defaultTo(0); // Priority level for customer service
    table.boolean('isGroup').notNullable().defaultTo(false);
    table.enum('type', ['contact']).notNullable().defaultTo('contact');
    table.enum('status', ['active', 'inactive', 'blocked']).notNullable().defaultTo('active');
    
    // Multi-platform support
    table.enum('platform', ['whatsapp', 'telegram', 'instagram', 'facebook', 'other']).notNullable().defaultTo('whatsapp');
    table.text('observations'); // Internal notes/observations
    
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes for better performance
    table.index(['platformId']);
    table.index(['platform']);
    table.index(['platform', 'platformId']); // Composite index for platform-specific queries
    table.index(['type']);
    table.index(['status']);
    table.index(['priority']);
    table.index(['email']);
    table.index(['cpf']);
    table.index(['cnpj']);
    table.index(['isGroup']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('customer');
} 