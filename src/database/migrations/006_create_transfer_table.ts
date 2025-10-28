import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('transfer', (table) => {
    table.string('id', 36).primary();
    table.string('historyId', 36).notNullable();
    table.boolean('newOrder').notNullable().defaultTo(false);
    table.boolean('checkOrder').notNullable().defaultTo(false);
    table.boolean('budget').notNullable().defaultTo(false);
    table.boolean('vaccine').notNullable().defaultTo(false);
    table.boolean('timeout').notNullable().defaultTo(false);
    table.boolean('hasOrder').notNullable().defaultTo(false);
    table.text('intent').nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Foreign key constraint
    table.foreign('historyId').references('id').inTable('history').onDelete('CASCADE');
    
    // Indexes for better performance
    table.index(['historyId']);
    table.index(['newOrder']);
    table.index(['checkOrder']);
    table.index(['budget']);
    table.index(['vaccine']);
    table.index(['timeout']);
    table.index(['hasOrder']);
    table.index(['createdAt']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('transfer');
}
