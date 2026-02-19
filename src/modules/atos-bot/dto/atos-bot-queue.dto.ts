/**
 * DTOs for Atos Bot data stored in Queue metadata
 * This defines the structure of metadata.bot in the queue
 */

import { AtosDetectIntentResponse, AtosIntentResponse } from './atos-bot.dto';

/**
 * Session parameters for Dialogflow session
 * Contains customer parameters like telefone, cnpj, email, etc.
 */
export interface AtosSessionParameters {
  telefone?: string;
  cnpj?: string;
  email?: string;
  name?: string;
  segmento?: string;
  [key: string]: any;
}

/**
 * Bot context stored in queue.metadata.bot
 * Contains all bot-related state and information
 */
export interface AtosBotContext {
  // Session identification
  sessionBot: string;

  // Dialogflow session customer parameters
  sessionParameters?: AtosSessionParameters;

  // Origin of the conversation
  origin: 'whatsapp' | 'chatweb';

  // Current destination/status
  destiny: 'bot' | 'human';

  // Flag to check if user went from WhatsApp to chatweb
  transferChatweb?: boolean;

  // Response from /api/intent/detect
  context?: AtosDetectIntentResponse;

  // Portal availability flags (boolean if CNPJ is available in that API)
  portalGem?: boolean;
  portalChc?: boolean;

  // Segment (GEM or CHC)
  segment?: 'GEM' | 'CHC';

  // Fallback count
  fallback?: number;

  // Timer to check if we send timeout messages
  timeoutCount?: number;

  // Integer option: 1 for new Order, 2 for checking order, etc.
  opt?: number;

  // Last bot response messages
  lastResponse?: AtosIntentResponse[];
}

/**
 * Queue metadata structure with bot context
 */
export interface QueueMetadataWithBot {
  // Platform-specific metadata
  platform?: string;
  contactUid?: string;
  instance?: string;
  remoteJid?: string;
  
  // Bot context
  bot?: AtosBotContext;
  
  // Additional metadata
  [key: string]: any;
}

