import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('orders', (table) => {
    table.string('id', 36).primary();
    table.string('orderId', 255).notNullable().unique;
    table.string('orderStatus', 255).notNullable();
    table.jsonb('orderDetails').nullable();
    table.string('originOrdered', 255).nullable();
    table.string('segment', 255).nullable();
    table.float('grossValue').nullable();
    table.float('netValue').nullable();
    table.float('billedValue').nullable();
    table.float('totalValue').nullable();
    table.string('historyId', 36).nullable();
    table.timestamp('dateOrder').nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    // Indexes
    table.index(['orderId']);
    table.index(['orderStatus']);
    table.index(['segment']);
    table.index(['historyId']);
    table.index(['dateOrder']);
    table.index(['totalValue']);

    // Foreign key constraints
    table.foreign('historyId').references('id').inTable('history').onDelete('SET NULL');

    // Note: sessionId is a foreign key reference to history.sessionId
    // Multiple orders can be linked to the same history record
    // sessionId is optional - orders can exist without being linked to a history record
    // historyId provides direct link to history table for better performance
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('orders');
}


