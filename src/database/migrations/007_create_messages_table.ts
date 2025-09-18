import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Platform-specific message identifier
    table.text('messageId').notNullable();
    
    // Session identifier for grouping related messages
    table.text('sessionId').notNullable();
    
    // Sender and recipient information
    table.uuid('senderId').notNullable();
    table.uuid('recipientId').notNullable();
    
    // Indicates if the message was sent by the system/user (true) or received from customer (false)
    table.boolean('fromMe').notNullable().defaultTo(false);
    table.boolean('system').notNullable().defaultTo(false);
    table.boolean('isGroup').notNullable().defaultTo(false);
    
    // Message content
    table.text('message').nullable();
    table.text('media').nullable(); // URL or path to media files
    table.enum('type', ['text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'other']).notNullable().defaultTo('text');
    
    // Platform information
    table.enum('platform', ['whatsapp', 'telegram', 'instagram', 'facebook', 'other']).notNullable().defaultTo('whatsapp');
    
    // Message status - varies by platform capabilities
    table.enum('status', ['pending', 'sent', 'delivered', 'read', 'failed', 'deleted']).notNullable().defaultTo('pending');
    
    // Store original API response and additional metadata
    table.jsonb('metadata').nullable();
    
    // Message threading/reply support
    table.text('replyMessageId').nullable();
    
    // Conversation context (optional - for grouping related messages)
    // table.uuid('conversationId');
    
    // Timestamps
    table.timestamp('sentAt').defaultTo(knex.fn.now());
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes for better performance
    table.index(['messageId']);
    table.index(['sessionId']);
    table.index(['replyMessageId']);
    table.index(['senderId']);
    table.index(['recipientId']);
    table.index(['fromMe']);
    table.index(['system']);
    table.index(['isGroup']);
    table.index(['platform']);
    table.index(['status']);
    table.index(['type']);
    table.index(['sentAt']);
    // table.index(['conversationId']);
    
    // Composite indexes for common queries
    table.index(['platform', 'messageId']);
    table.index(['sessionId', 'platform']);
    table.index(['senderId', 'platform']);
    table.index(['recipientId', 'platform']);
    table.index(['fromMe', 'platform']);
    table.index(['status', 'platform']);
    table.index(['sentAt', 'platform']);
    
    // Foreign key constraints
    table.foreign('senderId').references('id').inTable('user').onDelete('CASCADE');
    table.foreign('recipientId').references('id').inTable('customer').onDelete('CASCADE');
    table.foreign('replyMessageId').references('messageId').inTable('messages').onDelete('SET NULL');
    // table.foreign('conversationId').references('id').inTable('conversations').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('messages');
}
