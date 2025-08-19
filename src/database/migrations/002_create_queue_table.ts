import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('queues', (table) => {
    // Primary identification
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('sessionId').notNullable().unique(); // Typebot session ID
    table.text('customerPhone').notNullable(); // Customer phone number
    table.text('customerName'); // Customer name (if provided)
    
    // Queue status and flow
    table.enum('status', [
      'typebot',     // Customer interacting with typebot
      'waiting', // Typebot completed, waiting for operator
      'service',       // Operator actively serving
      'completed',         // Service completed successfully
      'cancelled',         // Customer cancelled or abandoned
    ]).notNullable().defaultTo('waiting');
    
    // Department and operator assignment
    table.enum('department', ['Personal', 'Fiscal', 'Accounting', 'Financial']).notNullable();
    table.uuid('requestedOperatorId').references('id').inTable('users'); // Customer's preferred operator
    table.uuid('assignedOperatorId').references('id').inTable('users'); // Actually assigned operator
    table.uuid('supervisorId').references('id').inTable('users'); // Escalation supervisor
    
    // Typebot interaction data
    table.jsonb('typebotData').defaultTo('{}'); // Store typebot responses
    table.text('customerDepartmentChoice'); // Department selected by customer
    table.text('customerOperatorChoice'); // Operator name requested by customer
    table.boolean('operatorAvailable').defaultTo(false); // Whether requested operator is online
    
    // Timing and metrics
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('typebotCompletedAt'); // When typebot finished
    table.timestamp('assignedAt'); // When operator was assigned
    table.timestamp('completedAt'); // When service ended
    
    // Integration data
    table.text('evolutionInstance'); // Evolution API instance name
    table.text('typebotSessionUrl'); // Typebot session URL
    table.jsonb('metadata').defaultTo('{}'); // Additional flexible data
    
    // Indexes for performance
    table.index(['sessionId']);
    table.index(['customerPhone']);
    table.index(['status']);
    table.index(['department']);
    table.index(['assignedOperatorId']);
    table.index(['createdAt']);
    table.index(['status', 'department']); // For operator queries
    table.index(['status', 'assignedOperatorId']); // For operator dashboard
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('queues');
} 