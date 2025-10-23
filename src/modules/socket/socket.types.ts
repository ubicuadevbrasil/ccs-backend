/**
 * Socket Event Types and Interfaces
 * 
 * This file contains all the TypeScript interfaces and types used for socket events
 * to ensure type safety across the application.
 */

export interface SocketEvent<T = any> {
  type: string;
  data: T;
  timestamp?: string;
}

export interface MessageEventData {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  chatId: string;
  platform: string;
  timestamp: string;
  messageType?: 'text' | 'image' | 'file' | 'audio' | 'video';
}

export interface MessageStatusUpdateData {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  chatId: string;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  data?: any;
}

export interface ChatUpdateData {
  chatId: string;
  action: 'created' | 'updated' | 'deleted' | 'user_joined' | 'user_left';
  data: any;
}

export interface QueueUpdateData {
  queueId: string;
  action: 'customer_joined' | 'customer_left' | 'customer_served' | 'queue_updated';
  customerId: string;
  customerName: string;
  estimatedWaitTime?: number;
  position?: number;
}

export interface SystemAlertData {
  id: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  component?: string;
  data?: any;
}

export interface UserStatusData {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  timestamp: string;
}

export interface TypingIndicatorData {
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface ConnectionEventData {
  message: string;
  userId: string;
  timestamp: string;
}

export interface PongEventData {
  timestamp: string;
}

/**
 * Socket Event Names
 */
export enum SocketEvents {
  // Connection events
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  PING = 'ping',
  PONG = 'pong',

  // Message events
  NEW_MESSAGE = 'new_message',
  MESSAGE_STATUS_UPDATE = 'message_status_update',

  // Chat events
  CHAT_UPDATE = 'chat_update',
  TYPING_INDICATOR = 'typing_indicator',

  // User events
  USER_STATUS_UPDATE = 'user_status_update',
  USER_STATUS_CHANGE = 'user_status_change',

  // Queue events
  QUEUE_UPDATE = 'queue_update',

  // System events
  SYSTEM_ALERT = 'system_alert',
  NOTIFICATION = 'notification',
}

/**
 * User Profile Types
 */
export enum UserProfile {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  OPERATOR = 'operator',
}

/**
 * Message Types
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
}

/**
 * Message Status Types
 */
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

/**
 * Notification Types
 */
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

/**
 * Alert Levels
 */
export enum AlertLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * User Status Types
 */
export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  BUSY = 'busy',
}
