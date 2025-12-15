export interface OtimaConfig {
  baseUrl: string;
  apiKey: string;
  whatsappWebhookSecret?: string;
  brokerCode?: string;
  customerCode?: string;
}

export interface OtimaSendMessageResponse {
  messageId: string;
  status: string;
  to: string;
  from?: string;
  timestamp?: string;
}

export interface OtimaWebhookMessagePayload {
  message_id: string;
  phone: string;
  username?: string;
  type: string;
  date: string | number;
  payload: {
    type: string;
    body: any;
  };
}

export interface OtimaStatusWebhookPayload {
  message_id: string;
  status: string;
}

export interface OtimaCredentialResponse {
  code: string;
  credential: string;
  customer: string;
  daily_message_limit: string;
  direction: string;
  monthly_message_limit: string;
  name: string;
  sender: string;
  technology: string;
}

export interface OtimaCustomerResponse {
  callbacks: {
    mo?: string;
    status?: string;
  };
  code: string;
  name: string;
}


