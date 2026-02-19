/**
 * Vonage Communications API Interfaces
 * Based on Vonage Messages API v1
 */

export interface VonageApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Context for replies and reactions
export interface VonageContext {
  message_uuid: string;
}

// Base Message Structure for v1 API
export interface VonageBaseMessage {
  to: string;
  from: string;
  message_type: string;
  channel: 'whatsapp';
  client_ref?: string;
  webhook_url?: string;
  context?: VonageContext;
}

// Text Message Content
export interface VonageTextMessage extends VonageBaseMessage {
  message_type: 'text';
  text: string;
}

// Image Message Content
export interface VonageImageMessage extends VonageBaseMessage {
  message_type: 'image';
  image: {
    url: string;
    caption?: string;
  };
}

// Video Message Content
export interface VonageVideoMessage extends VonageBaseMessage {
  message_type: 'video';
  video: {
    url: string;
    caption?: string;
  };
}

// Audio Message Content
export interface VonageAudioMessage extends VonageBaseMessage {
  message_type: 'audio';
  audio: {
    url: string;
  };
}

// File/Document Message Content
export interface VonageFileMessage extends VonageBaseMessage {
  message_type: 'file';
  file: {
    url: string;
    caption?: string;
  };
}

// Template Message Content
export interface VonageTemplateMessage extends VonageBaseMessage {
  message_type: 'template';
  template: {
    name: string;
    parameters?: string[];
  };
}

// Custom Template Message Content
export interface VonageCustomTemplateMessage extends VonageBaseMessage {
  message_type: 'custom';
  custom: {
    type: 'template';
    template: {
      namespace: string;
      name: string;
      components?: any[];
      language: {
        policy: 'deterministic';
        code: string;
      };
    };
  };
}

export type VonageMessageContent = 
  | VonageTextMessage
  | VonageImageMessage
  | VonageVideoMessage
  | VonageAudioMessage
  | VonageFileMessage
  | VonageTemplateMessage
  | VonageCustomTemplateMessage;

// Send Message Request (v1 API format)
export type VonageSendMessageRequest = VonageMessageContent;

// Send Message Response
export interface VonageSendMessageResponse {
  message_uuid: string;
  to: string;
  from: string;
  timestamp: string;
  direction: 'outbound';
  message_type: string;
}

// Webhook Inbound Message
export interface VonageInboundMessageWebhook {
  message_uuid: string;
  to: string;
  from: string;
  timestamp: string;
  direction: 'inbound';
  message: {
    content: VonageMessageContent;
  };
}

// Webhook Status
export interface VonageStatusWebhook {
  message_uuid: string;
  to: string;
  from: string;
  timestamp: string;
  status: 'delivered' | 'read' | 'sent' | 'failed';
  error?: {
    code: number;
    reason: string;
  };
}

// Message Types for Content Creation
export type VonageMessageType = 
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'template_mtm'
  | 'template_custom'
  | 'template_optin'
  | 'template_chatweb_prd'
  | 'template_chatweb_hml';

// Template Parameters
export interface VonageTemplateParameters {
  template_name: string;
  template_namespace: string;
  parameters?: string[];
  components?: any[];
}

// Environment Configuration
export interface VonageConfig {
  number: string;
  messageUrl: string;
  user: string;
  password: string;
  isProduction: boolean;
}
