import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('orderId', 255).notNullable();
    table.string('orderStatus', 255).notNullable();
    table.jsonb('orderDetails').nullable();
    table.string('originOrdered', 255).nullable();
    table.string('segment', 255).nullable();
    table.float('grossValue').nullable();
    table.float('netValue').nullable();
    table.float('billedValue').nullable();
    table.float('totalValue').nullable();
    table.text('sessionId').nullable();
    table.timestamp('dateOrder').nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    // Indexes
    table.index(['orderId']);
    table.index(['orderStatus']);
    table.index(['segment']);
    table.index(['sessionId']);
    table.index(['dateOrder']);
    table.index(['totalValue']);

    // Note: sessionId is not a foreign key because history.sessionId is not unique
    // It's just a reference field for linking orders to sessions
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('orders');
}


