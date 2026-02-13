import { Knex } from 'knex';
import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';

export async function seed(knex: Knex): Promise<void> {
  console.log('🌱 Starting history and messages seed...');

  // Clear existing data
  await knex('messages').del();
  await knex('history').del();
  console.log('🗑️  Cleared existing history and messages data');

  // Get all customers, users, and tabulations from database
  const customers = await knex('customer').select('id', 'platformId', 'name', 'platform');
  const users = await knex('user').select('id', 'name', 'profile').where('status', 'active');
  const tabulations = await knex('tabulation').select('id', 'name', 'status').where('status', 'active');

  if (customers.length === 0) {
    console.log('⚠️  No customers found. Please run customers seed first.');
    return;
  }

  if (users.length === 0) {
    console.log('⚠️  No users found. Please run users seed first.');
    return;
  }

  if (tabulations.length === 0) {
    console.log('⚠️  No tabulations found. Please run tabulation seed first.');
    return;
  }

  console.log(`📊 Found ${customers.length} customers, ${users.length} users, and ${tabulations.length} tabulations`);

  const histories: Array<{
    id: string;
    sessionId: string;
    protocol: string;
    userId: string;
    customerId: string;
    tabulationId: string;
    observations: string | null;
    platform: string;
    direction: 'inbound' | 'outbound';
    startedAt: Date;
    attendedAt: Date;
    finishedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  const messages: Array<{
    id: string;
    messageId: string;
    sessionId: string;
    senderType: string;
    recipientType: string;
    customerId: string | null;
    userId: string | null;
    fromMe: boolean;
    system: boolean;
    isGroup: boolean;
    message: string | null;
    media: string | null;
    type: string;
    platform: string;
    status: string;
    metadata: any;
    replyMessageId: string | null;
    sentAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  // December 2025 date range
  const december2025Start = new Date('2025-12-01T00:00:00.000Z');
  const december2025End = new Date('2025-12-31T23:59:59.999Z');

  // Generate one history per customer
  for (const customer of customers) {
    const historyId = randomUUID();
    const sessionId = randomUUID();
    
    // Assign a user to all histories (required for attendedAt)
    const assignedUser = faker.helpers.arrayElement(users);
    
    // Assign a tabulation to all histories - only active tabulations
    const assignedTabulation = faker.helpers.arrayElement(tabulations);
    
    // Determine direction (mostly inbound)
    const direction = faker.datatype.boolean({ probability: 0.1 }) ? 'outbound' : 'inbound';
    
    // Generate realistic timestamps in December 2025
    // startedAt: random time in December 2025
    const startedAt = faker.date.between({ from: december2025Start, to: december2025End });
    
    // attendedAt: 1-30 minutes after startedAt (realistic response time)
    const responseTimeMinutes = faker.number.int({ min: 1, max: 30 });
    const attendedAt = new Date(startedAt.getTime() + responseTimeMinutes * 60 * 1000);
    
    // finishedAt: 5-120 minutes after attendedAt (realistic conversation duration)
    // Ensure it doesn't exceed December 31, 2025
    const conversationDurationMinutes = faker.number.int({ min: 5, max: 120 });
    let finishedAt = new Date(attendedAt.getTime() + conversationDurationMinutes * 60 * 1000);
    
    // If finishedAt exceeds December 31, 2025, cap it at the end of December
    if (finishedAt > december2025End) {
      finishedAt = december2025End;
    }
    
    // Generate protocol (friendly session identifier) - December 2025 format
    const protocol = `202512${String(startedAt.getDate()).padStart(2, '0')}${faker.string.numeric(11)}`;
    
    const observations = faker.datatype.boolean({ probability: 0.3 })
      ? faker.lorem.sentence()
      : null;

    histories.push({
      id: historyId,
      sessionId,
      protocol,
      userId: assignedUser.id,
      customerId: customer.id,
      tabulationId: assignedTabulation.id,
      observations,
      platform: customer.platform || 'whatsapp',
      direction,
      startedAt,
      attendedAt,
      finishedAt,
      createdAt: startedAt,
      updatedAt: finishedAt,
    });

    // Generate messages for this history (3-8 messages per conversation)
    const messageCount = faker.number.int({ min: 3, max: 8 });
    const messageTimestamps: Date[] = [];
    
    // Generate message timestamps within the history timeframe (between startedAt and finishedAt)
    for (let i = 0; i < messageCount; i++) {
      const minDate = i === 0 ? startedAt : messageTimestamps[i - 1];
      const maxDate = finishedAt;
      messageTimestamps.push(faker.date.between({ from: minDate, to: maxDate }));
    }
    
    // Sort timestamps
    messageTimestamps.sort((a, b) => a.getTime() - b.getTime());

    let previousMessageId: string | null = null;

    for (let i = 0; i < messageCount; i++) {
      const messageId = randomUUID();
      const sentAt = messageTimestamps[i];
      
      // Alternate between customer and user messages
      // First message is usually from customer (unless outbound)
      const isFromCustomer = direction === 'inbound' 
        ? (i === 0 || i % 2 === 0)
        : (i === 0 ? false : i % 2 === 1);
      
      const fromMe = !isFromCustomer;
      const senderType = isFromCustomer ? 'customer' : 'user';
      const recipientType = isFromCustomer ? 'user' : 'customer';
      
      // Determine message type (70% text, 30% media)
      const messageTypeRoll = faker.number.float({ min: 0, max: 1 });
      let type: string;
      let message: string | null = null;
      let media: string | null = null;
      
      if (messageTypeRoll < 0.7) {
        // Text message
        type = 'text';
        message = faker.lorem.sentence({ min: 3, max: 15 });
      } else if (messageTypeRoll < 0.85) {
        // Image
        type = 'image';
        message = faker.image.url();
        media = faker.image.url();
      } else if (messageTypeRoll < 0.95) {
        // Audio
        type = 'audio';
        message = 'Audio message';
        media = faker.internet.url({ appendSlash: false }) + '/audio/' + faker.string.alphanumeric(10) + '.mp3';
      } else {
        // Document
        type = 'document';
        const docTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
        const docType = faker.helpers.arrayElement(docTypes);
        message = `Document: ${faker.system.fileName({ extensionCount: 0 })}.${docType}`;
        media = faker.internet.url({ appendSlash: false }) + '/documents/' + faker.string.alphanumeric(10) + '.' + docType;
      }
      
      // Message status (most are delivered/read if older)
      const daysSinceSent = (new Date().getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24);
      let status: string;
      if (daysSinceSent > 1) {
        status = faker.helpers.arrayElement(['delivered', 'read']);
      } else if (daysSinceSent > 0.1) {
        status = faker.helpers.arrayElement(['sent', 'delivered']);
      } else {
        status = faker.helpers.arrayElement(['pending', 'sent']);
      }
      
      // Sometimes reply to previous message (30% chance, except first message)
      const replyMessageId = i > 0 && faker.datatype.boolean({ probability: 0.3 })
        ? previousMessageId
        : null;
      
      messages.push({
        id: messageId,
        messageId: `msg_${faker.string.alphanumeric(20)}`,
        sessionId,
        senderType,
        recipientType,
        customerId: isFromCustomer ? customer.id : null,
        userId: !isFromCustomer ? assignedUser.id : null,
        fromMe,
        system: false,
        isGroup: false,
        message,
        media,
        type,
        platform: customer.platform || 'whatsapp',
        status,
        metadata: faker.datatype.boolean({ probability: 0.2 })
          ? { timestamp: sentAt.toISOString(), source: 'seed' }
          : null,
        replyMessageId,
        sentAt,
        createdAt: sentAt,
        updatedAt: sentAt,
      });
      
      previousMessageId = messages[messages.length - 1].messageId;
    }
  }

  // Insert histories
  await knex('history').insert(histories);
  console.log(`✅ Inserted ${histories.length} histories`);

  // Insert messages
  await knex('messages').insert(messages);
  console.log(`✅ Inserted ${messages.length} messages`);

  // Calculate average service times
  const avgResponseTime = histories.reduce((sum, h) => {
    return sum + (h.attendedAt.getTime() - h.startedAt.getTime()) / (1000 * 60); // minutes
  }, 0) / histories.length;
  
  const avgConversationDuration = histories.reduce((sum, h) => {
    return sum + (h.finishedAt.getTime() - h.attendedAt.getTime()) / (1000 * 60); // minutes
  }, 0) / histories.length;

  // Statistics
  console.log('📊 History statistics:');
  console.log(`   - Total histories: ${histories.length}`);
  console.log(`   - All have startedAt, attendedAt, and finishedAt: ${histories.length} (100%)`);
  console.log(`   - Inbound: ${histories.filter(h => h.direction === 'inbound').length}`);
  console.log(`   - Outbound: ${histories.filter(h => h.direction === 'outbound').length}`);
  console.log(`   - With tabulation: ${histories.length} (100%)`);
  console.log(`   - Average response time: ${avgResponseTime.toFixed(2)} minutes`);
  console.log(`   - Average conversation duration: ${avgConversationDuration.toFixed(2)} minutes`);
  
  console.log('📱 Message statistics:');
  console.log(`   - Total messages: ${messages.length}`);
  console.log(`   - Text: ${messages.filter(m => m.type === 'text').length}`);
  console.log(`   - Image: ${messages.filter(m => m.type === 'image').length}`);
  console.log(`   - Audio: ${messages.filter(m => m.type === 'audio').length}`);
  console.log(`   - Document: ${messages.filter(m => m.type === 'document').length}`);
  console.log(`   - From customer: ${messages.filter(m => m.fromMe === false).length}`);
  console.log(`   - From user/system: ${messages.filter(m => m.fromMe === true).length}`);
  console.log(`   - With replies: ${messages.filter(m => m.replyMessageId).length}`);
  
  console.log('✅ History and messages seeded successfully!');
}

