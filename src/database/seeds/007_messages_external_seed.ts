import { Knex } from 'knex';
import * as dotenv from 'dotenv';
import externalKnexConfig from '../../../knexfile.external';
import * as crypto from 'crypto';

// Load environment variables
dotenv.config();

/**
 * Interface for external message data from MySQL tab_logs
 */
interface ExternalMessageData {
  id: string;
  sessionid: string;
  fromid: string;
  toid: string;
  msgdir: string; // 'i' (inbound) or 'o' (outbound)
  msgtype: string;
  msgtext: string | null;
  msgurl: string | null;
  msgcaption: string | null;
  origem: string | null; // 'wpp' or 'chatweb'
  dt: string; // sentAt timestamp
}

/**
 * Interface for the final message record to be inserted
 */
interface MessageRecord {
  id: string;
  messageId: string;
  sessionId: string;
  senderType: 'system' | 'bot' | 'customer' | 'user';
  recipientType: 'system' | 'bot' | 'customer' | 'user';
  customerId: string | null;
  userId: string | null;
  fromMe: boolean;
  system: boolean;
  isGroup: boolean;
  message: string | null;
  media: string | null;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker' | 'other';
  platform: 'whatsapp' | 'chatweb' | 'telegram' | 'instagram' | 'facebook' | 'other';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';
  metadata: any | null;
  replyMessageId: string | null;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper function to safely parse dates
 */
function safeParseDate(dateString: any): Date | null {
  if (!dateString) return null;
  
  try {
    // Check if it's already a valid Date object
    if (dateString instanceof Date && !isNaN(dateString.getTime())) {
      return dateString;
    }
    
    // Check for invalid date strings
    const str = String(dateString);
    if (str.includes('NaN') || str.includes('Invalid') || str === 'null' || str === 'undefined' || str === '0NaN-NaN-NaNTNaN:NaN:NaN.NaN+NaN:NaN') {
      return null;
    }
    
    const date = new Date(str);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (error) {
    return null;
  }
}

/**
 * Helper function to safely parse text values
 */
function safeParseText(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  
  const str = String(value).trim();
  return str === '' ? null : str;
}

/**
 * Helper function to map platform from origem field
 */
function mapPlatform(origem: string | null): 'whatsapp' | 'chatweb' | 'telegram' | 'instagram' | 'facebook' | 'other' {
  if (!origem) return 'whatsapp';
  
  const origemLower = origem.toLowerCase();
  
  if (origemLower === 'wpp' || origemLower === 'whatsapp') {
    return 'whatsapp';
  }
  if (origemLower === 'chatweb') {
    return 'chatweb'; // Map chatweb to 'chatweb' platform
  }
  if (origemLower.includes('telegram') || origemLower.includes('tg')) {
    return 'telegram';
  }
  if (origemLower.includes('instagram') || origemLower.includes('ig')) {
    return 'instagram';
  }
  if (origemLower.includes('facebook') || origemLower.includes('fb')) {
    return 'facebook';
  }
  
  return 'other';
}

/**
 * Helper function to map direction from msgdir field
 */
function mapDirection(msgdir: string): 'inbound' | 'outbound' {
  const msgdirLower = msgdir.toLowerCase();
  return msgdirLower === 'i' ? 'inbound' : 'outbound';
}

/**
 * Helper function to determine sender and recipient types based on actual IDs
 */
function mapSenderRecipientTypes(fromId: string, toId: string): {
  senderType: 'system' | 'bot' | 'customer' | 'user';
  recipientType: 'system' | 'bot' | 'customer' | 'user';
  fromMe: boolean;
  senderId: string | null;
  recipientId: string | null;
} {
  const fromType = getIdType(fromId);
  const toType = getIdType(toId);
  
  // Determine sender type
  let senderType: 'system' | 'bot' | 'customer' | 'user';
  let senderId: string | null = null;
  
  if (fromType === 'bot') {
    senderType = 'bot';
  } else if (fromType === 'user') {
    senderType = 'user';
    senderId = fromId;
  } else if (fromType === 'customer') {
    senderType = 'customer';
    senderId = fromId;
  } else {
    senderType = 'system';
  }
  
  // Determine recipient type
  let recipientType: 'system' | 'bot' | 'customer' | 'user';
  let recipientId: string | null = null;
  
  if (toType === 'bot') {
    recipientType = 'bot';
  } else if (toType === 'user') {
    recipientType = 'user';
    recipientId = toId;
  } else if (toType === 'customer') {
    recipientType = 'customer';
    recipientId = toId;
  } else {
    recipientType = 'system';
  }
  
  // Determine fromMe based on sender type
  const fromMe = senderType === 'bot' || senderType === 'user';
  
  return {
    senderType,
    recipientType,
    fromMe,
    senderId,
    recipientId
  };
}

/**
 * Helper function to map message type from external msgtype
 */
function mapMessageType(msgtype: string): 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker' | 'other' {
  const typeLower = msgtype.toLowerCase();
  
  // Direct mappings for known types
  if (typeLower === 'audio') return 'audio';
  if (typeLower === 'image') return 'image';
  if (typeLower === 'video') return 'video';
  if (typeLower === 'document') return 'document';
  if (typeLower === 'vcard') return 'contact';
  
  // Special mappings
  if (typeLower === 'chat') return 'text'; // Chat messages are text
  if (typeLower === 'ptt') return 'audio'; // Push-to-talk is audio
  if (typeLower === 'file') return 'document'; // Generic file is document
  
  // System/connection types - map to 'other' since they're not standard message types
  if (typeLower === 'connect') return 'other';
  if (typeLower === 'disconnect') return 'other';
  if (typeLower === 'transfer') return 'other';
  
  // Fallback for any other types
  return 'other';
}

/**
 * Helper function to check if an ID is the bot ID
 */
function isBotId(id: string): boolean {
  return id === '491b9564-2d79-11ea-978f-2e728ce88125';
}

/**
 * Helper function to determine if an ID is a customer mobile or user ID
 * Returns 'customer' if it looks like a mobile number, 'user' if it's a UUID, null if bot
 */
function getIdType(id: string): 'customer' | 'user' | 'bot' | null {
  if (!id) return null;
  
  if (isBotId(id)) return 'bot';
  
  // Check if it's a UUID (user ID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return 'user';
  }
  
  // Otherwise assume it's a customer mobile number
  return 'customer';
}

/**
 * Helper function to look up customer ID by platformId or cnpj
 */
async function lookupCustomerId(knex: Knex, id: string): Promise<string | null> {
  try {
    // First try to find by platformId
    let customer = await knex('customer')
      .select('id')
      .where('platformId', id)
      .first();
    
    if (customer) {
      return customer.id;
    }
    
    // If not found by platformId, try by cnpj
    customer = await knex('customer')
      .select('id')
      .where('cnpj', id)
      .first();
    
    return customer ? customer.id : null;
  } catch (error) {
    console.error(`Error looking up customer ID for ${id}:`, error);
    return null;
  }
}

/**
 * Helper function to look up user ID (should match user.id directly)
 */
async function lookupUserId(knex: Knex, id: string): Promise<string | null> {
  try {
    const user = await knex('user')
      .select('id')
      .where('id', id)
      .first();
    
    return user ? user.id : null;
  } catch (error) {
    console.error(`Error looking up user ID for ${id}:`, error);
    return null;
  }
}

/**
 * Helper function to get all history records with their sessionId and sessionBot
 */
async function getAllHistoryRecords(knex: Knex): Promise<Array<{id: string, sessionId: string, sessionBot: string | null}>> {
  try {
    const histories = await knex('history')
      .select('id', 'sessionId', 'sessionBot')
      .whereNotNull('sessionId');
    
    console.log(`📊 Found ${histories.length} history records to process`);
    return histories;
  } catch (error) {
    console.error('Error fetching history records:', error);
    return [];
  }
}

/**
 * Helper function to fetch messages for a specific session
 */
async function fetchMessagesForSession(externalKnex: any, sessionId: string): Promise<ExternalMessageData[]> {
  try {
    const result = await externalKnex.raw(`
      SELECT 
        l.id,
        l.sessionid,
        l.fromid,
        l.toid,
        l.msgdir,
        l.msgtype,
        l.msgtext,
        l.msgurl,
        l.msgcaption,
        l.origem,
        l.dt
      FROM tab_logs l
      WHERE l.sessionid = ?
      ORDER BY l.dt ASC
    `, [sessionId]);
    
    return result[0] || [];
  } catch (error) {
    console.error(`Error fetching messages for session ${sessionId}:`, error);
    return [];
  }
}

export async function seed(knex: Knex): Promise<void> {
  console.log('🌱 Starting messages seed...');

  // Clear existing message data
  await knex('messages').del();
  console.log('🗑️  Cleared existing message data');

  // Create external database connection (MySQL)
  const environment = process.env.NODE_ENV || 'development';
  const externalConfig = externalKnexConfig[environment];
  
  if (!externalConfig) {
    console.log('⚠️  External database configuration not found. Skipping messages seed.');
    return;
  }

  // Create external knex instance
  const externalKnex = require('knex')(externalConfig);
  
  try {
    // Test the external connection
    await externalKnex.raw('SELECT 1');
    console.log('✅ External database connection established');
  } catch (error) {
    console.log('⚠️  Cannot connect to external database. Skipping messages seed.');
    console.log(`Error: ${error.message}`);
    return;
  }

  try {
    // Step 1: Get all history records
    const historyRecords = await getAllHistoryRecords(knex);
    
    if (historyRecords.length === 0) {
      console.log('⚠️  No history records found. Skipping messages seed.');
      return;
    }

    // Step 2: Process history records in batches
    const batchSize = parseInt(process.env.MESSAGES_BATCH_SIZE || '50');
    let totalProcessed = 0;
    let totalMessagesInserted = 0;
    const startTime = Date.now();
    
    console.log(`📦 Processing ${historyRecords.length} history records in batches of ${batchSize}...`);
    
    for (let i = 0; i < historyRecords.length; i += batchSize) {
      const batch = historyRecords.slice(i, i + batchSize);
      
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(historyRecords.length / batchSize);
      const progressPercent = ((i / historyRecords.length) * 100).toFixed(1);
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records) - ${progressPercent}% complete...`);
      
      for (const historyRecord of batch) {
        try {
          console.log(`🔍 Processing history record ${totalProcessed + 1}/${historyRecords.length}:`, {
            historyId: historyRecord.id,
            sessionId: historyRecord.sessionId,
            sessionBot: historyRecord.sessionBot
          });
          
          // Step 2a: Try to fetch messages by sessionId first
          let messages = await fetchMessagesForSession(externalKnex, historyRecord.sessionId);
          
          // Step 2b: If no messages found and we have sessionBot, try sessionBot
          if (messages.length === 0 && historyRecord.sessionBot) {
            console.log(`🔍 No messages found for sessionId, trying sessionBot: ${historyRecord.sessionBot}`);
            messages = await fetchMessagesForSession(externalKnex, historyRecord.sessionBot);
          }
          
          if (messages.length === 0) {
            console.log(`⚠️  No messages found for history ${historyRecord.id}`);
            totalProcessed++;
            continue;
          }
          
          console.log(`📨 Found ${messages.length} messages for history ${historyRecord.id}`);
          
          // Step 2c: Transform messages and insert them
          const messagesToInsert: MessageRecord[] = [];
          
          for (const externalMessage of messages) {
            const messageRecord = await transformToMessageRecord(knex, externalMessage, historyRecord.sessionId);
            messagesToInsert.push(messageRecord);
          }
          
          // Step 2d: Insert messages for this history record
          if (messagesToInsert.length > 0) {
            await knex('messages').insert(messagesToInsert);
            totalMessagesInserted += messagesToInsert.length;
            console.log(`✅ Inserted ${messagesToInsert.length} messages for history ${historyRecord.id}`);
          }
          
          totalProcessed++;
        } catch (error) {
          console.error(`❌ Error processing history record ${historyRecord.id}:`, error);
          totalProcessed++;
        }
      }
    }
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000; // in seconds
    
    console.log('✅ Messages seeded successfully!');
    console.log(`📊 Total history records processed: ${totalProcessed}`);
    console.log(`📊 Total messages inserted: ${totalMessagesInserted}`);
    console.log(`📊 Batches processed: ${Math.ceil(historyRecords.length / batchSize)}`);
    console.log(`⏱️  Total processing time: ${totalTime.toFixed(2)} seconds`);
    console.log(`📈 Average time per history record: ${(totalTime / totalProcessed).toFixed(3)} seconds`);
    console.log(`📈 Messages per second: ${(totalMessagesInserted / totalTime).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error during messages seed:', error);
  } finally {
    // Close external database connection
    if (externalKnex) {
      await externalKnex.destroy();
      console.log('🔌 External database connection closed');
    }
  }
}

/**
 * Transforms external message data into message record
 */
async function transformToMessageRecord(
  knex: Knex,
  external: ExternalMessageData, 
  internalSessionId: string
): Promise<MessageRecord> {
  const now = new Date();
  
  // Generate UUID for id field
  const messageUuid = crypto.randomUUID();

  // Parse sentAt date
  const sentAt = safeParseDate(external.dt) || now;

  // Map direction and determine sender/recipient types based on actual IDs
  const direction = mapDirection(external.msgdir);
  const { senderType, recipientType, fromMe, senderId, recipientId } = mapSenderRecipientTypes(external.fromid, external.toid);

  // Map message type
  const messageType = mapMessageType(external.msgtype);

  // Determine if this is a system message (could be enhanced based on business logic)
  const isSystem = false; // Default to false, could be enhanced based on external data

  // Create metadata object with additional information
  const metadata = {
    externalId: external.id,
    fromId: external.fromid,
    toId: external.toid,
    originalType: external.msgtype,
    caption: safeParseText(external.msgcaption),
    direction: direction
  };

  // Determine customerId and userId based on sender/recipient using proper lookups
  let customerId: string | null = null;
  let userId: string | null = null;
  
  // Look up customer ID if sender is customer
  if (senderType === 'customer' && senderId) {
    customerId = await lookupCustomerId(knex, senderId);
  }
  
  // Look up user ID if sender is user
  if (senderType === 'user' && senderId) {
    userId = await lookupUserId(knex, senderId);
  }
  
  // Look up customer ID if recipient is customer (and sender wasn't customer)
  if (recipientType === 'customer' && recipientId && !customerId) {
    customerId = await lookupCustomerId(knex, recipientId);
  }
  
  // Look up user ID if recipient is user (and sender wasn't user)
  if (recipientType === 'user' && recipientId && !userId) {
    userId = await lookupUserId(knex, recipientId);
  }

  return {
    id: messageUuid,
    messageId: external.id, // External message ID from tab_logs
    sessionId: internalSessionId, // Our internal sessionId (interaction identifier)
    senderType,
    recipientType,
    customerId,
    userId,
    fromMe,
    system: isSystem,
    isGroup: false, // Default to false, could be enhanced based on external data
    message: safeParseText(external.msgtext),
    media: safeParseText(external.msgurl),
    type: messageType,
    platform: mapPlatform(external.origem),
    status: 'delivered', // Default to delivered for historical messages
    metadata,
    replyMessageId: null, // No reply information in external data
    sentAt,
    createdAt: now,
    updatedAt: now,
  };
}
