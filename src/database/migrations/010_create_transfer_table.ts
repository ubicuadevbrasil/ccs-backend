import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('transbordo', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('externalId', 255).notNullable().unique(); // Original ID from tab_transbordo
    table.string('cnpj', 20).nullable(); // CNPJ from external system
    table.string('sessionBot', 255).nullable(); // Bot session identifier
    table.string('email', 255).nullable(); // Customer email
    table.string('origin', 255).nullable(); // origem - where the transfer came from
    table.string('destination', 255).nullable(); // destino - where the transfer went to
    table.string('telephone', 20).nullable(); // Customer phone number
    table.text('chatBot').nullable(); // Bot conversation content
    table.text('chatHuman').nullable(); // Human conversation content
    table.timestamp('startedAt').nullable(); // dtin - when the transfer started
    table.timestamp('finishedAt').nullable(); // dten - when the transfer finished
    table.text('orderQuery').nullable(); // consultar_pedido - order inquiry content
    table.text('budget').nullable(); // orcamento - budget information
    table.text('newOrder').nullable(); // novo_pedido - new order information
    table.text('vaccine').nullable(); // vacina - vaccine information
    table.text('purchaseConversion').nullable(); // convert_compra - purchase conversion
    table.text('orders').nullable(); // pedidos - orders information
    table.text('transferIntent').nullable(); // transbordo_intent - transfer intent
    table.text('journeyStatus').nullable(); // jornadaStatus - customer journey status
    table.decimal('value', 10, 2).nullable(); // valor - monetary value
    table.string('segment', 255).nullable(); // segmanto - customer segment
    table.text('rating').nullable(); // avaliacao - customer rating/feedback
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    // Indexes for better performance
    table.index(['externalId']);
    table.index(['cnpj']);
    table.index(['sessionBot']);
    table.index(['email']);
    table.index(['telephone']);
    table.index(['origin']);
    table.index(['destination']);
    table.index(['startedAt']);
    table.index(['finishedAt']);
    table.index(['segment']);
    table.index(['value']);
    table.index(['rating']);
    
    // Composite indexes for common queries
    table.index(['origin', 'destination']);
    table.index(['sessionBot', 'startedAt']);
    table.index(['segment', 'value']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('transbordo');
}
