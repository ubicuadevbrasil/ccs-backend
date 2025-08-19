import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('messages', (table) => {
    // Primary identification
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('sessionId').notNullable().references('id').inTable('queues');
    
    // Evolution API integration
    table.text('evolutionMessageId').unique(); // Evolution API message ID (key.id)
    table.text('remoteJid'); // Customer phone number from Evolution API
    table.boolean('fromMe').defaultTo(false); // Whether message is from our system
    table.text('instance'); // Evolution API instance name
    table.text('pushName'); // Customer display name
    table.text('source'); // Message source (android, ios, web)
    table.bigint('messageTimestamp'); // Evolution API timestamp
    
    // Message content and type
    table.enum('messageType', [
      'conversation',      // Text message
      'imageMessage',      // Image
      'videoMessage',      // Video
      'audioMessage',      // Audio/Voice note
      'documentMessage',   // Document/File
      'stickerMessage',    // Sticker
      'contactMessage',    // Contact
      'locationMessage',   // Location
      'reactionMessage',   // Reaction
    ]).notNullable();
    
    table.enum('from', ['Customer', 'Operator', 'Typebot', 'System']).notNullable();
    table.enum('direction', ['inbound', 'outbound']).notNullable();
    table.text('content'); // Text content (for conversation, caption, etc.)
    
    // Media information (for media messages)
    table.text('mediaUrl'); // File URL from Evolution API
    table.text('mimetype'); // File MIME type
    table.text('caption'); // Media caption
    table.text('fileName'); // Document filename
    table.text('fileLength'); // File size in bytes
    table.text('fileSha256'); // File SHA256 hash
    
    // Media-specific fields
    table.integer('width'); // Image/Video width
    table.integer('height'); // Image/Video height
    table.integer('seconds'); // Audio/Video duration
    table.boolean('isAnimated'); // For animated stickers
    table.boolean('ptt'); // Push to talk (voice note)
    table.integer('pageCount'); // Document page count
    
    // Location data
    table.decimal('latitude', 10, 8); // Location latitude
    table.decimal('longitude', 11, 8); // Location longitude
    table.text('locationName'); // Location name
    table.text('locationAddress'); // Location address
    
    // Contact data
    table.text('contactDisplayName'); // Contact display name
    table.text('contactVcard'); // Contact vCard data
    
    // Reaction data
    table.text('reactionText'); // Reaction emoji
    table.text('reactionToMessageId'); // ID of message being reacted to
    
    // Sender information (for operator and customer messages)
    table.uuid('senderId'); // Can reference both users (operators) and customers
    table.text('senderName'); // Name of sender
    table.text('senderPhone'); // Phone number of sender
    
    // Integration data
    table.text('typebotMessageId'); // Typebot message ID
    table.jsonb('evolutionData').defaultTo('{}'); // Complete Evolution API data
    table.jsonb('metadata').defaultTo('{}'); // Additional flexible data
    
    // Message status
    table.enum('status', [
      'sent',         // Message sent successfully
      'delivered',    // Message delivered to recipient
      'read',         // Message read by recipient
      'failed',       // Message failed to send
      'pending'       // Message pending delivery
    ]).notNullable().defaultTo('pending');
    
    // Timing
    table.timestamp('sentAt').defaultTo(knex.fn.now());
    table.timestamp('deliveredAt');
    table.timestamp('readAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index(['sessionId']);
    table.index(['messageType']);
    table.index(['direction']);
    table.index(['remoteJid']);
    table.index(['evolutionMessageId']);
    table.index(['sentAt']);
    table.index(['sessionId', 'sentAt']); // For conversation history
    table.index(['senderId']);
    table.index(['status']);
    table.index(['fromMe']);
    table.index(['instance']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('messages');
} 