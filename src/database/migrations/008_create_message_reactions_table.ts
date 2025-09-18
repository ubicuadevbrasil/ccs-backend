import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('messageReactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Reference to the message being reacted to
    table.text('messageId').notNullable();
    
    // Who reacted (can be user or customer ID)
    table.uuid('reactorId').notNullable();
    
    // Reaction emoji
    table.text('emoji').notNullable();
    
    // When the reaction was made
    table.timestamp('reactedAt').defaultTo(knex.fn.now());
    
    // Timestamps
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes for better performance
    table.index(['messageId']);
    table.index(['reactorId']);
    table.index(['emoji']);
    table.index(['reactedAt']);
    
    // Composite indexes for common queries
    table.index(['messageId', 'emoji']); // Count reactions by emoji per message
    table.index(['messageId', 'reactorId']); // Check if user already reacted
    
    // Foreign key constraint
    table.foreign('messageId').references('messageId').inTable('messages').onDelete('CASCADE');
    
    // Unique constraint to prevent duplicate reactions from same user
    table.unique(['messageId', 'reactorId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('messageReactions');
}
