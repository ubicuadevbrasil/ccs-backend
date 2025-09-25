import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { MessageStorageService } from '../messages/message-storage.service';
import { QueueService } from '../customer-queue/queue.service';
import { User } from '../user/entities/user.entity';
import { SendMessageDto, SendMessageResponseDto } from './dto/send-message.dto';
import { 
  MessageType, 
  MessagePlatform, 
  MessageStatus, 
  SenderType, 
  RecipientType 
} from '../messages/entities/message.entity';
import { PlatformMessageData } from '../messages/platform-mappers';
import { PlatformChatServiceFactory } from './services/platform-chat.service.factory';
import { EvolutionMessageData } from './services/chat.evolution.service';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(
        private readonly messageStorageService: MessageStorageService,
        private readonly platformChatServiceFactory: PlatformChatServiceFactory,
        private readonly queueService: QueueService,
    ) { }

    /**
     * Send a message from a user to a customer
     */
    async sendMessage(
        sendMessageDto: SendMessageDto,
        user: User
    ): Promise<SendMessageResponseDto> {
        try {
            // Validate that either message or media is provided
            if (!sendMessageDto.message && !sendMessageDto.media) {
                throw new BadRequestException('Either message text or media must be provided');
            }

            // Get customer data from queue using sessionId
            const customerData = await this.getCustomerDataForMessage(sendMessageDto.sessionId);
            
            this.logger.log(`User ${user.id} sending message to customer ${customerData.customerId} on ${customerData.platform}`);

            // Check if platform is supported
            if (!this.platformChatServiceFactory.isPlatformSupported(customerData.platform)) {
                throw new BadRequestException(`Platform ${customerData.platform} is not supported yet`);
            }

            // Send message via platform-specific service FIRST
            let platformResponse: any = null;
            let platformMessageId: string | null = null;
            let sendSuccess = false;

            try {
                const platformService = this.platformChatServiceFactory.getService(customerData.platform);

                // Create platform-specific data for sending
                const platformData = this.createPlatformSpecificData(sendMessageDto, user, customerData);

                // Send message via platform
                const sendResult = await platformService.sendMessage(platformData);

                if (sendResult.success) {
                    platformResponse = sendResult.platformResponse;
                    platformMessageId = sendResult.messageId;
                    sendSuccess = true;
                    this.logger.log(`Message sent successfully via ${customerData.platform}. Platform Message ID: ${sendResult.messageId}`);
                } else {
                    this.logger.error(`Failed to send message via ${customerData.platform}: ${sendResult.error}`);
                    throw new Error(sendResult.error || 'Failed to send message via platform');
                }
            } catch (platformError) {
                this.logger.error(`Platform service error for ${customerData.platform}:`, platformError);
                throw platformError;
            }

            // Generate a unique message ID for the platform
            const messageId = platformMessageId || this.generateMessageId(customerData.platform);

            // Create platform message data AFTER getting platform response
            const platformMessageData: PlatformMessageData = {
                messageId,
                sessionId: sendMessageDto.sessionId,
                senderType: SenderType.USER,
                recipientType: RecipientType.CUSTOMER,
                customerId: customerData.customerId,
                userId: user.id,
                fromMe: true, // User is sending the message
                system: false,
                isGroup: sendMessageDto.isGroup ?? customerData.isGroup,
                message: sendMessageDto.message,
                media: sendMessageDto.media,
                type: sendMessageDto.type || MessageType.TEXT,
                platform: customerData.platform,
                status: sendSuccess ? MessageStatus.SENT : MessageStatus.FAILED,
                metadata: {
                    ...platformResponse,
                    // Additional metadata
                    sentByUser: {
                        id: user.id,
                        name: user.name,
                        login: user.login,
                        profile: user.profile,
                    },
                },
                replyMessageId: sendMessageDto.replyMessageId,
            };

            // Store the message using the message storage service AFTER platform response
            const result = await this.messageStorageService.storeMessage(platformMessageData);

            this.logger.log(`Message processed successfully. PostgreSQL ID: ${result.postgresMessage.id}, Message ID: ${messageId}`);

            // Return the response in Redis message format
            return {
                id: result.postgresMessage.id,
                messageId: result.postgresMessage.messageId,
                sessionId: result.postgresMessage.sessionId,
                senderType: result.postgresMessage.senderType,
                recipientType: result.postgresMessage.recipientType,
                customerId: result.postgresMessage.customerId!,
                userId: result.postgresMessage.userId!,
                fromMe: result.postgresMessage.fromMe,
                system: result.postgresMessage.system,
                isGroup: result.postgresMessage.isGroup,
                message: result.postgresMessage.message,
                media: result.postgresMessage.media,
                type: result.postgresMessage.type,
                platform: result.postgresMessage.platform,
                status: result.postgresMessage.status,
                metadata: result.postgresMessage.metadata,
                replyMessageId: result.postgresMessage.replyMessageId,
                sentAt: result.postgresMessage.sentAt,
                createdAt: result.postgresMessage.createdAt,
                updatedAt: result.postgresMessage.updatedAt,
            };
        } catch (error) {
            this.logger.error(`Error sending message from user ${user.id} for session ${sendMessageDto.sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Generate a unique message ID based on platform
     */
    private generateMessageId(platform: MessagePlatform): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${platform}_${timestamp}_${random}`;
    }

    /**
     * Create platform-specific metadata
     */
    private createPlatformSpecificMetadata(sendMessageDto: SendMessageDto, customerData: any): any {
        const baseMetadata = {
            timestamp: new Date().toISOString(),
            platform: customerData.platform,
        };

        switch (customerData.platform) {
            case MessagePlatform.WHATSAPP:
                return {
                    ...baseMetadata,
                    // WhatsApp-specific metadata
                    whatsappSpecific: {
                        instance: customerData.instance || 'default',
                        number: customerData.number || customerData.customerPhone,
                        customerName: customerData.customerName,
                        customerPhone: customerData.customerPhone,
                    },
                };
            case MessagePlatform.INSTAGRAM:
                return {
                    ...baseMetadata,
                    // Instagram-specific metadata
                    instagramSpecific: {
                        instagramUserId: customerData.customerId,
                        threadId: sendMessageDto.metadata?.threadId,
                    },
                };
            case MessagePlatform.TELEGRAM:
                return {
                    ...baseMetadata,
                    // Telegram-specific metadata
                    telegramSpecific: {
                        telegramChatId: customerData.customerId,
                        telegramUserId: sendMessageDto.metadata?.telegramUserId,
                    },
                };
            default:
                return baseMetadata;
        }
    }

    /**
     * Create platform-specific data for sending messages
     */
    private createPlatformSpecificData(sendMessageDto: SendMessageDto, user: User, customerData: any): any {
        switch (customerData.platform) {
            case MessagePlatform.WHATSAPP:
                return this.createEvolutionData(sendMessageDto, user, customerData);
            case MessagePlatform.INSTAGRAM:
                // TODO: Implement Instagram data creation
                throw new Error('Instagram platform data creation not implemented yet');
            case MessagePlatform.TELEGRAM:
                // TODO: Implement Telegram data creation
                throw new Error('Telegram platform data creation not implemented yet');
            default:
                throw new Error(`Unsupported platform: ${customerData.platform}`);
        }
    }

    /**
     * Create Evolution API specific data
     */
    private createEvolutionData(sendMessageDto: SendMessageDto, user: User, customerData: any): EvolutionMessageData {
        // Extract instance and number from customer data
        const instance = customerData.instance || 'default';
        const number = customerData.number || customerData.customerPhone;

        return {
            instance,
            number,
            text: sendMessageDto.message,
            mediaUrl: sendMessageDto.media,
            mediaType: sendMessageDto.media ? this.getMediaTypeFromUrl(sendMessageDto.media) : undefined,
            messageType: sendMessageDto.type || MessageType.TEXT,
            replyMessageId: sendMessageDto.replyMessageId,
            isGroup: sendMessageDto.isGroup ?? customerData.isGroup,
        };
    }

    /**
     * Get media type from URL
     */
    private getMediaTypeFromUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname.toLowerCase();

            if (pathname.includes('.jpg') || pathname.includes('.jpeg') || pathname.includes('.png') || pathname.includes('.gif')) {
                return 'image';
            } else if (pathname.includes('.mp4') || pathname.includes('.avi') || pathname.includes('.mov')) {
                return 'video';
            } else if (pathname.includes('.mp3') || pathname.includes('.wav') || pathname.includes('.ogg')) {
                return 'audio';
            } else if (pathname.includes('.pdf') || pathname.includes('.doc') || pathname.includes('.docx')) {
                return 'document';
            } else {
                return 'unknown';
            }
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Get chat history for a specific session
     */
    async getChatHistory(sessionId: string, limit: number = 50): Promise<any[]> {
        try {
            this.logger.log(`Getting chat history for session: ${sessionId}`);
            return await this.messageStorageService.getSessionMessages(sessionId, limit);
        } catch (error) {
            this.logger.error(`Error getting chat history for session ${sessionId}:`, error);
            throw error;
        }
    }

  /**
   * Get session statistics
   */
  async getSessionStatistics(sessionId: string): Promise<{
    redisCount: number;
    postgresCount: number;
    lastMessageAt?: string;
    firstMessageAt?: string;
  }> {
    try {
      this.logger.log(`Getting session statistics for session: ${sessionId}`);
      return await this.messageStorageService.getSessionStatistics(sessionId);
    } catch (error) {
      this.logger.error(`Error getting session statistics for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get customer data from queue by session ID
   */
  async getCustomerDataFromQueue(sessionId: string): Promise<any> {
    try {
      this.logger.log(`Getting customer data from queue for session: ${sessionId}`);
      
      // Get queue data by session ID
      const queueData = await this.queueService.findQueueBySessionId(sessionId);
      
      // Return the queue data with customer information
      return {
        sessionId: queueData.sessionId,
        customerId: queueData.customerId,
        customer: queueData.customer,
        userId: queueData.userId,
        user: queueData.user,
        platform: queueData.platform,
        status: queueData.status,
        createdAt: queueData.createdAt,
        attendedAt: queueData.attendedAt,
        lastMessage: queueData.lastMessage,
        metadata: queueData.metadata,
        // Additional computed properties
        isBot: queueData.isBot,
        isWaiting: queueData.isWaiting,
        isInService: queueData.isInService,
        isAttended: queueData.isAttended,
        waitingTime: queueData.waitingTime,
        isWhatsApp: queueData.isWhatsApp,
        isTelegram: queueData.isTelegram,
        isInstagram: queueData.isInstagram,
        isFacebook: queueData.isFacebook,
      };
    } catch (error) {
      this.logger.error(`Error getting customer data from queue for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get customer data and automatically populate message fields
   */
  async getCustomerDataForMessage(sessionId: string): Promise<{
    customerId: string;
    customerName?: string;
    customerPhone?: string;
    instance?: string;
    number?: string;
    isGroup: boolean;
    platform: MessagePlatform;
  }> {
    try {
      const queueData = await this.getCustomerDataFromQueue(sessionId);
      
      return {
        customerId: queueData.customerId,
        customerName: queueData.customer?.name || queueData.customer?.pushName,
        customerPhone: queueData.customer?.contact,
        instance: queueData.metadata?.instance || 'default',
        number: queueData.metadata?.number || queueData.customer?.contact,
        isGroup: queueData.customer?.isGroup || false,
        platform: queueData.platform as MessagePlatform,
      };
    } catch (error) {
      this.logger.error(`Error getting customer data for message from session ${sessionId}:`, error);
      throw error;
    }
  }
}
