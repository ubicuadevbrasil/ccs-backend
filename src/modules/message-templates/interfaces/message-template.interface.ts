export enum MessageTemplateType {
  GREETING = 'greeting',
  FOLLOW_UP = 'follow_up',
  REMINDER = 'reminder',
  SUPPORT = 'support',
  MARKETING = 'marketing',
  NOTIFICATION = 'notification',
  CUSTOM = 'custom'
}

export interface MessageTemplate {
  id: string;
  message: string;
  type: MessageTemplateType;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageTemplateFilters {
  type?: MessageTemplateType;
  search?: string;
  limit?: number;
  offset?: number;
}
