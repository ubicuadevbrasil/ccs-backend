import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('queues', (table) => {
    // Add direction enum field for inbound/outbound
    table.enum('direction', ['inbound', 'outbound'])
      .notNullable()
      .defaultTo('inbound')
      .comment('Direction of the queue: inbound (customer initiated) or outbound (operator initiated)');
    
    // Add index for direction field for performance
    table.index(['direction']);
    table.index(['direction', 'status']); // Composite index for filtering by direction and status
    table.index(['direction', 'department']); // Composite index for filtering by direction and department
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('queues', (table) => {
    // Remove indexes first
    table.dropIndex(['direction', 'department']);
    table.dropIndex(['direction', 'status']);
    table.dropIndex(['direction']);
    
    // Remove the direction column
    table.dropColumn('direction');
  });
}
