/**
 * DTOs for Atos Bot operations
 */

export interface AtosApiConfig {
  apiUrl: string;
  apiUsr: string;
  apiPwd: string;
  apiPortal: string;
}

export interface AtosApiConfigMap {
  GEM: AtosApiConfig;
  CHC: AtosApiConfig;
}

export interface AtosIntentResponse {
  text: string;
  template: string | false;
  transbordoWeb: boolean;
  components?: AtosTemplateComponent[];
}

export interface AtosTemplateComponent {
  type: string;
  sub_type?: string;
  index?: string;
  parameters?: Array<{ type: string; text: string }>;
}

export interface AtosContext {
  name: string;
  parameters: Record<string, string>;
}

export interface AtosDetectIntentPayload {
  queryInput: {
    text: string;
  };
  context: string;
}

export interface AtosDetectIntentResponse {
  contexts: AtosContext[];
  intentName: string;
  responseMessages: Array<{ text: string }>;
  fallbackCounters: number;
}

export interface AtosClientAvailableResponse {
  available: string;
  companyName: string;
  email: string;
  phoneNumber: string;
}

export interface AtosSessionInfo {
  cnpj?: string;
  email?: string;
  telefone?: string;
  portalGem?: boolean; // Boolean flag if CNPJ is available in GEM API
  portalChc?: boolean; // Boolean flag if CNPJ is available in CHC API
  name?: string;
  context?: AtosDetectIntentResponse; // Response from /api/intent/detect
  lastResponse?: AtosIntentResponse[]; // Last bot response messages
  status?: number; // Legacy status number (deprecated, use QueueStatus instead)
  segment?: 'GEM' | 'CHC'; // Renamed from segmento
  fallback?: number; // Fallback count
  timeoutCount?: number; // Timer to check if we send timeout messages
  opt?: number; // Integer: 1 for new Order, 2 for checking order, etc.
}

export interface AtosQueueEntry {
  mobile: string;
  sessionBot: string;
  tempo: number;
  status: number;
  opt?: string;
  fallback: number;
  timeoutCount: number;
  name?: string;
  segmento?: string;
  context?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
}

export interface AtosLogEntry {
  id: string;
  msgtext: string;
  msgtype: string;
  fromid: string;
  sessionid: string;
  msgdir: string;
  stread?: number;
}

