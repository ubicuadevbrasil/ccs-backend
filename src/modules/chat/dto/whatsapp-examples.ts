import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType, MessagePlatform } from '../../messages/entities/message.entity';

/**
 * Comprehensive Swagger examples for WhatsApp message types
 */

// Text Message Example
export const WhatsAppTextMessageExample = {
  sessionId: 'session_whatsapp_123456789',
  message: 'Hello! Thank you for contacting us. How can I assist you today?',
  type: 'text'
};

// Image Message Example
export const WhatsAppImageMessageExample = {
  sessionId: 'session_whatsapp_123456789',
  message: 'Here is the product image you requested',
  media: 'https://example.com/images/product.jpg',
  type: 'image'
};

// Video Message Example
export const WhatsAppVideoMessageExample = {
  sessionId: 'session_whatsapp_123456789',
  message: 'Here is the tutorial video you requested',
  media: 'https://example.com/videos/tutorial.mp4',
  type: 'video'
};

// Audio Message Example
export const WhatsAppAudioMessageExample = {
  sessionId: 'session_whatsapp_123456789',
  media: 'https://example.com/audio/voice-message.mp3',
  type: 'audio'
};

// Document Message Example
export const WhatsAppDocumentMessageExample = {
  sessionId: 'session_whatsapp_123456789',
  message: 'Please find attached the invoice you requested',
  media: 'https://example.com/documents/invoice.pdf',
  type: 'document'
};

// Location Message Example
export const WhatsAppLocationMessageExample = {
  sessionId: 'session_whatsapp_123456789',
  message: 'lat:-23.550520,lng:-46.633308,name:São Paulo Office,address:Rua Augusta, 123 - São Paulo, SP',
  type: 'location'
};

// Contact Message Example
export const WhatsAppContactMessageExample = {
  sessionId: 'session_whatsapp_123456789',
  message: 'name:Support Team,number:+5511888888888',
  type: 'contact'
};

// Sticker Message Example
export const WhatsAppStickerMessageExample = {
  sessionId: 'session_whatsapp_123456789',
  media: 'https://example.com/stickers/happy-face.webp',
  type: 'sticker'
};

// Reply Message Example
export const WhatsAppReplyMessageExample = {
  sessionId: 'session_whatsapp_123456789',
  message: 'Thank you for your question. Here is the answer...',
  type: 'text',
  replyMessageId: 'msg_123456789_abc123'
};

// Group Message Example
export const WhatsAppGroupMessageExample = {
  sessionId: 'session_whatsapp_group_123456789',
  message: 'Hello everyone! This is an important announcement.',
  type: 'text',
  isGroup: true
};

// All Examples Array
export const WhatsAppMessageExamples = {
  text: WhatsAppTextMessageExample,
  image: WhatsAppImageMessageExample,
  video: WhatsAppVideoMessageExample,
  audio: WhatsAppAudioMessageExample,
  document: WhatsAppDocumentMessageExample,
  location: WhatsAppLocationMessageExample,
  contact: WhatsAppContactMessageExample,
  sticker: WhatsAppStickerMessageExample,
  reply: WhatsAppReplyMessageExample,
  group: WhatsAppGroupMessageExample,
};

// Customer Queue Data Example
export const CustomerQueueDataExample = {
  sessionId: 'session_whatsapp_123456789',
  customerId: '123e4567-e89b-12d3-a456-426614174000',
  customer: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    platformId: '5511999999999@s.whatsapp.net',
    pushName: 'João Silva',
    name: 'João Silva',
    profilePicUrl: 'https://example.com/profile-pics/joao.jpg',
    contact: '+5511999999999',
    email: 'joao.silva@email.com',
    priority: 5,
    isGroup: false,
    type: 'contact',
    status: 'active',
    platform: 'whatsapp',
    observations: 'VIP customer',
    tags: [
      {
        id: 'tag_123',
        tag: 'VIP',
        normalizedTag: 'vip',
        isSystemTag: true,
        isUserTag: false
      }
    ],
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z'
  },
  userId: 'user_123e4567-e89b-12d3-a456-426614174000',
  platform: 'whatsapp',
  status: 'service',
  createdAt: '2024-01-01T10:00:00.000Z',
  attendedAt: '2024-01-01T10:05:00.000Z',
  lastMessage: {
    id: 'msg_123',
    messageId: 'whatsapp_123456789_abc123',
    message: 'Hello, I need help with my order',
    type: 'text',
    fromMe: false,
    sentAt: '2024-01-01T10:00:00.000Z'
  },
  metadata: {
    instance: 'default',
    number: '+5511999999999',
    customerName: 'João Silva',
    customerPhone: '+5511999999999',
    queuePosition: 1,
    waitingTime: 300000
  }
};