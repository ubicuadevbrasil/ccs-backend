import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('groupParticipants', (table) => {
    // Primary identification
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Foreign key to groups table
    table.uuid('groupId').notNullable().references('id').inTable('groups').onDelete('CASCADE');
    
    // Participant identification
    table.text('participantId').notNullable(); // Evolution API participant ID (e.g., "5511949122854@s.whatsapp.net")
    table.text('jid').notNullable(); // Participant JID
    table.text('lid'); // Participant LID (local ID)
    
    // Participant role and permissions
    table.enum('admin', ['superadmin', 'admin', null]).defaultTo(null); // Admin role
    table.enum('role', ['owner', 'admin', 'member']).notNullable().defaultTo('member');
    
    // Participant information
    table.text('name'); // Participant display name
    table.text('phoneNumber'); // Clean phone number (without @s.whatsapp.net)
    
    // Integration data
    table.jsonb('evolutionData').defaultTo('{}'); // Complete Evolution API participant data
    table.jsonb('metadata').defaultTo('{}'); // Additional flexible data
    
    // Status tracking
    table.enum('status', ['active', 'inactive', 'removed']).notNullable().defaultTo('active');
    
    // Timing
    table.timestamp('joinedAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index(['groupId']);
    table.index(['participantId']);
    table.index(['jid']);
    table.index(['role']);
    table.index(['status']);
    table.index(['groupId', 'status']);
    table.index(['participantId', 'status']);
    table.index(['groupId', 'role']);
    
    // Unique constraint to prevent duplicate participants in the same group
    table.unique(['groupId', 'participantId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('group_participants');
} 