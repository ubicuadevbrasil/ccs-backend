/**
 * DTO for WhatsApp statistics response
 */
export class WhatsAppStatsDto {
  totalMessages: number;
  sentMessages: number;
  receivedMessages: number;
  failedMessages: number;
  activeConversations: number;
  connectedAccounts: number;
}
