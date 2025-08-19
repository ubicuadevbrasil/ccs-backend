import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('groups', (table) => {
    // Primary identification
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Evolution API integration
    table.text('evolutionGroupId').notNullable().unique(); // Evolution API group ID (e.g., "120363401241665225@g.us")
    table.text('instance').notNullable(); // Evolution API instance name
    
    // Group basic information
    table.text('subject').notNullable(); // Group name/title
    table.text('description'); // Group description
    table.text('descId'); // Description ID from Evolution API
    table.text('pictureUrl'); // Group picture URL
    
    // Group ownership and management
    table.text('owner').notNullable(); // Group owner phone number
    table.text('subjectOwner'); // Who set the current subject
    table.bigint('subjectTime'); // When the subject was last changed
    table.bigint('creation').notNullable(); // Group creation timestamp
    
    // Group settings and status
    table.boolean('restrict').defaultTo(false); // Restricted group
    table.boolean('announce').defaultTo(false); // Announcement group
    table.boolean('isCommunity').defaultTo(false); // Community group
    table.boolean('isCommunityAnnounce').defaultTo(false); // Community announcement group
    
    // Group statistics
    table.integer('size').notNullable().defaultTo(0); // Number of participants
    
    // Integration data
    table.jsonb('evolutionData').defaultTo('{}'); // Complete Evolution API data
    table.jsonb('metadata').defaultTo('{}'); // Additional flexible data
    
    // Status tracking
    table.enum('status', ['active', 'inactive', 'archived']).notNullable().defaultTo('active');
    
    // Timing
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index(['evolutionGroupId']);
    table.index(['instance']);
    table.index(['owner']);
    table.index(['subject']);
    table.index(['status']);
    table.index(['creation']);
    table.index(['instance', 'status']);
    table.index(['owner', 'status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('groups');
} 