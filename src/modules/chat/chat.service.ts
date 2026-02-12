import { Injectable, Logger, NotFoundException, BadRequestException, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageStorageService } from '../messages/message-storage.service';
import { QueueService } from '../customer-queue/queue.service';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { SendMessageDto, SendMessageResponseDto } from './dto/send-message.dto';
import { TransferChatDto, TransferChatResponseDto } from './dto/transfer-chat.dto';
import { ChatEndServiceDto, EndServiceResponseDto } from './dto/end-service.dto';
import { QueueItemDto, WaitingQueueResponseDto } from './dto/queue.dto';
import { AttendDto, AttendResponseDto } from './dto/attend.dto';
import { StartServiceDto, StartServiceResponseDto } from './dto/start-service.dto';
import { HistoryService } from '../history/history.service';
import { HistoryDirection, HistoryPlatform } from '../history/entities/history.entity';
import { Queue, QueueStatus } from '../customer-queue/entities/queue.entity';
import { CustomerService } from '../customer/customer.service';
import { OtimaService } from '../whatsapp/otima/otima.service';
import { TemplatesService } from '../templates/templates.service';
import { CreateQueueWhatsAppDto } from '../customer-queue/dto/queue.dto';
import { 
  MessageType, 
  MessagePlatform, 
  MessageStatus, 
  SenderType, 
  RecipientType 
} from '../messages/entities/message.entity';
import { PlatformMessageData } from '../messages/message-mapper';
import { PlatformChatServiceFactory } from './services/platform-chat.service.factory';
import { EvolutionMessageData } from './services/chat.evolution.service';
import { EvolutionMessageMapperService } from '../whatsapp/evolution/evolution-mapper';
import { OtimaMessageMapperService } from '../whatsapp/otima/otima-mapper';
import { randomUUID } from 'crypto';
import { getProtocol } from '../../common/utils/date.utils';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(
        private readonly messageStorageService: MessageStorageService,
        private readonly platformChatServiceFactory: PlatformChatServiceFactory,
        private readonly queueService: QueueService,
        private readonly userService: UserService,
        private readonly customerService: CustomerService,
        private readonly otimaService: OtimaService,
        private readonly templatesService: TemplatesService,
        private readonly historyService: HistoryService,
        private readonly configService: ConfigService,
        private readonly socketGateway: SocketGateway,
        @Inject('EVOLUTION_MAPPER') @Optional() private readonly evolutionMapper?: EvolutionMessageMapperService | null,
        @Inject('OTIMA_MAPPER') @Optional() private readonly otimaMapper?: OtimaMessageMapperService | null,
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
                    // Handle both Otima and Evolution response formats
                    platformResponse = sendResult.platformResponse || sendResult.otimaResponse || sendResult.evolutionResponse || sendResult;
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

            // Update the last message in the queue (same pattern as webhook service)
            await this.queueService.updateLastMessage(sendMessageDto.sessionId, result.redisMessage);
            this.logger.log(`Last message updated in queue for session ${sendMessageDto.sessionId}`);

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
                // Check which WhatsApp provider is enabled (Otima is the default)
                const isOtimaEnabled = this.configService.get<boolean>('OTIMA_WHATSAPP', false);
                const isEvolutionEnabled = this.configService.get<boolean>('EVOLUTION_WHATSAPP', false);
                
                // Use Otima provider (preferred/default)
                if (isOtimaEnabled && this.otimaMapper) {
                    return this.otimaMapper.createOtimaData(sendMessageDto, user, customerData);
                }
                
                // Fallback to Evolution provider
                if (isEvolutionEnabled && this.evolutionMapper) {
                    return this.evolutionMapper.createEvolutionData(sendMessageDto, user, customerData);
                }
                
                // No provider enabled
                throw new Error('No WhatsApp provider is enabled. Please enable OTIMA_WHATSAPP=true or EVOLUTION_WHATSAPP=true');
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
        direction: queueData.metadata?.direction?.toLowerCase() === 'outbound' ? 'outbound' : 'inbound',
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
    platformType?: string;
    isGroup: boolean;
    platform: MessagePlatform;
  }> {
    try {
      const queueData = await this.getCustomerDataFromQueue(sessionId);
      
      const customerData = {
        customerId: queueData.customerId,
        customerName: queueData.customer?.name || queueData.customer?.pushName,
        customerPhone: queueData.customer?.contact,
        instance: queueData.metadata?.instance || 'default',
        number: queueData.metadata?.number || queueData.customer?.contact,
        platformType: queueData.metadata?.platform || queueData.platformType, // Use metadata.platform as fallback
        isGroup: queueData.customer?.isGroup || false,
        platform: queueData.platform as MessagePlatform,
      };
      
      return customerData;
    } catch (error) {
      this.logger.error(`Error getting customer data for message from session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Transfer chat session to a different user
   */
  async transferChat(transferChatDto: TransferChatDto): Promise<TransferChatResponseDto> {
    try {
      this.logger.log(`Transferring chat session ${transferChatDto.sessionId} to user ${transferChatDto.userId}`);

      // Get current queue data
      const queueData = await this.queueService.findQueueBySessionId(transferChatDto.sessionId);
      const previousUserId = queueData.userId;

      // Get the new user
      const newUser = await this.userService.findUserById(transferChatDto.userId);

      // Update queue with new user
      await this.queueService.updateUser(transferChatDto.sessionId, newUser);

      // Get customer data for sending message
      const customerData = await this.getCustomerDataForMessage(transferChatDto.sessionId);

      // Create transfer message
      const newUserName = newUser.name || newUser.login;
      const transferMessage = `Atendimento transferido para *${newUserName}*`;

      // Send system message to customer
      await this.sendSystemMessage(
        transferChatDto.sessionId,
        customerData,
        transferMessage,
        newUser,
      );

      const updatedQueue = await this.queueService.findQueueBySessionId(transferChatDto.sessionId);
      const queuePayload = this.buildQueuePayloadForSocket(updatedQueue);
      this.socketGateway.sendToUsers(
        [previousUserId, transferChatDto.userId],
        'customer_transfer',
        { queue: queuePayload },
      );

      this.logger.log(`Chat session ${transferChatDto.sessionId} transferred from user ${previousUserId} to user ${transferChatDto.userId}`);

      return {
        sessionId: transferChatDto.sessionId,
        previousUserId,
        newUserId: transferChatDto.userId,
        newUserName,
        transferMessage,
      };
    } catch (error) {
      this.logger.error(`Error transferring chat session ${transferChatDto.sessionId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to transfer chat: ${error.message}`);
    }
  }

  /**
   * Send a system message to a customer
   */
  private async sendSystemMessage(
    sessionId: string,
    customerData: {
      customerId: string;
      customerName?: string;
      customerPhone?: string;
      instance?: string;
      number?: string;
      platformType?: string;
      isGroup: boolean;
      platform: MessagePlatform;
    },
    message: string,
    user: User,
  ): Promise<void> {
    try {
      // Check if platform is supported
      if (!this.platformChatServiceFactory.isPlatformSupported(customerData.platform)) {
        this.logger.warn(`Platform ${customerData.platform} is not supported for system messages`);
        return;
      }

      // Create send message DTO for system message
      const sendMessageDto: SendMessageDto = {
        sessionId,
        message,
        type: MessageType.TEXT,
        isGroup: customerData.isGroup,
      };

      // Send message via platform-specific service
      let platformResponse: any = null;
      let platformMessageId: string | null = null;
      let sendSuccess = false;

      try {
        const platformService = this.platformChatServiceFactory.getService(customerData.platform);
        const platformData = this.createPlatformSpecificData(sendMessageDto, user, customerData);
        const sendResult = await platformService.sendMessage(platformData);

        if (sendResult.success) {
          // Handle both Otima and Evolution response formats
          platformResponse = sendResult.platformResponse || sendResult.otimaResponse || sendResult.evolutionResponse || sendResult;
          platformMessageId = sendResult.messageId;
          sendSuccess = true;
          this.logger.log(`System message sent successfully via ${customerData.platform}. Platform Message ID: ${sendResult.messageId}`);
        } else {
          this.logger.error(`Failed to send system message via ${customerData.platform}: ${sendResult.error}`);
        }
      } catch (platformError) {
        this.logger.error(`Platform service error for system message on ${customerData.platform}:`, platformError);
      }

      // Generate a unique message ID for the platform
      const messageId = platformMessageId || this.generateMessageId(customerData.platform);

      // Create platform message data for system message
      const platformMessageData: PlatformMessageData = {
        messageId,
        sessionId,
        senderType: SenderType.SYSTEM,
        recipientType: RecipientType.CUSTOMER,
        customerId: customerData.customerId,
        userId: user.id,
        fromMe: true,
        system: true,
        isGroup: customerData.isGroup,
        message,
        type: MessageType.TEXT,
        platform: customerData.platform,
        status: sendSuccess ? MessageStatus.SENT : MessageStatus.FAILED,
        metadata: {
          ...platformResponse,
          isSystemMessage: true,
          sentByUser: {
            id: user.id,
            name: user.name,
            login: user.login,
            profile: user.profile,
          },
        },
      };

      // Store the system message
      const result = await this.messageStorageService.storeMessage(platformMessageData);
      this.logger.log(`System message stored successfully for session ${sessionId}`);
      
      // Update the last message in the queue (same pattern as webhook service)
      await this.queueService.updateLastMessage(sessionId, result.redisMessage);
      this.logger.log(`Last message updated in queue for session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error sending system message for session ${sessionId}:`, error);
      // Don't throw error - system message failure shouldn't break the transfer
    }
  }

  /**
   * Build a serializable queue payload for socket events
   */
  private buildQueuePayloadForSocket(queue: Queue): Record<string, unknown> {
    return {
      sessionId: queue.sessionId,
      customerId: queue.customerId,
      customer: queue.customer ?? undefined,
      userId: queue.userId,
      user: queue.user ?? undefined,
      platform: queue.platform,
      status: queue.status,
      createdAt: queue.createdAt?.toISOString?.() ?? queue.createdAt,
      attendedAt: queue.attendedAt?.toISOString?.() ?? queue.attendedAt ?? undefined,
      lastMessage: queue.lastMessage ?? undefined,
      metadata: queue.metadata ?? undefined,
    };
  }

  /**
   * End service for a chat session
   */
  async endService(endServiceDto: ChatEndServiceDto, user: User): Promise<EndServiceResponseDto> {
    try {
      this.logger.log(`Ending service for session ${endServiceDto.sessionId} by user ${user.id}`);

      // Get current queue data
      const queueData = await this.queueService.findQueueBySessionId(endServiceDto.sessionId);
      
      // Get customer data for sending message
      const customerData = await this.getCustomerDataForMessage(endServiceDto.sessionId);

      // Create end service message
      const userName = user.name || user.login;
      const endServiceMessage = `*${userName}* encerrou o atendimento`;

      // Send system message to customer (using MessagePlatform from customerData)
      await this.sendSystemMessage(
        endServiceDto.sessionId,
        customerData,
        endServiceMessage,
        user,
      );

      // Map MessagePlatform to HistoryPlatform
      const historyPlatform = this.mapToHistoryPlatform(customerData.platform);

      // Get direction from queueData (metadata or default to INBOUND)
      const direction = this.getDirectionFromQueueData(queueData);
      const protocol = queueData.metadata?.protocol ?? getProtocol();

      // Create history record with tabulationId, protocol (from queue creation), and donorCode
      await this.historyService.createHistory({
        sessionId: queueData.sessionId,
        protocol,
        donorCode: endServiceDto.donorCode,
        userId: queueData.userId,
        customerId: queueData.customerId,
        tabulationId: endServiceDto.tabulationId,
        observations: endServiceDto.observations,
        platform: historyPlatform,
        direction,
        startedAt: queueData.createdAt.toISOString(),
        attendedAt: queueData.attendedAt?.toISOString(),
        finishedAt: new Date().toISOString(),
      });

      // Delete from queue
      await this.queueService.deleteQueue(endServiceDto.sessionId);

      this.logger.log(`Service ended successfully for session ${endServiceDto.sessionId}`);

      return {
        sessionId: endServiceDto.sessionId,
        tabulationId: endServiceDto.tabulationId,
        endServiceMessage,
        message: 'Service ended successfully',
      };
    } catch (error) {
      this.logger.error(`Error ending service for session ${endServiceDto.sessionId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to end service: ${error.message}`);
    }
  }

  /**
   * Map MessagePlatform to HistoryPlatform
   */
  private mapToHistoryPlatform(platform: MessagePlatform): HistoryPlatform {
    switch (platform) {
      case MessagePlatform.WHATSAPP:
        return HistoryPlatform.WHATSAPP;
      case MessagePlatform.TELEGRAM:
        return HistoryPlatform.TELEGRAM;
      case MessagePlatform.INSTAGRAM:
        return HistoryPlatform.INSTAGRAM;
      case MessagePlatform.FACEBOOK:
        return HistoryPlatform.FACEBOOK;
      default:
        return HistoryPlatform.OTHER;
    }
  }

  /**
   * Get direction from queue data (from metadata or default to INBOUND)
   */
  private getDirectionFromQueueData(queueData: any): HistoryDirection {
    // Check if direction is stored in metadata
    if (queueData.metadata?.direction) {
      const metadataDirection = queueData.metadata.direction.toLowerCase();
      if (metadataDirection === 'outbound') {
        return HistoryDirection.OUTBOUND;
      }
      if (metadataDirection === 'inbound') {
        return HistoryDirection.INBOUND;
      }
    }

    // Default to INBOUND if not specified
    return HistoryDirection.INBOUND;
  }

  /**
   * Get waiting customers in queue (simple data: customer info + sessionId)
   */
  async getWaitingQueue(): Promise<WaitingQueueResponseDto> {
    try {
      this.logger.log('Getting waiting customers from queue');

      // Get all queue items with WAITING status
      const waitingQueues = await this.queueService.findAllQueue({
        status: QueueStatus.WAITING,
        page: '1',
        limit: '1000', // Get all waiting customers
      });

      // Map to simple queue items
      const queueItems: QueueItemDto[] = waitingQueues.data.map((queue) => ({
        sessionId: queue.sessionId,
        customerId: queue.customerId,
        customer: {
          id: queue.customer?.id || queue.customerId,
          name: queue.customer?.name,
          pushName: queue.customer?.pushName,
          contact: queue.customer?.contact,
          platform: queue.platform,
          profilePicUrl: queue.customer?.profilePicUrl,
        },
      }));

      return {
        data: queueItems,
        total: waitingQueues.total,
      };
    } catch (error) {
      this.logger.error('Error getting waiting queue:', error);
      throw error;
    }
  }

  /**
   * Attend a customer (start service)
   * If sessionId is provided, attend that specific customer
   * Otherwise, get the oldest waiting customer
   */
  async attendCustomer(attendDto: AttendDto, user: User): Promise<AttendResponseDto> {
    try {
      let queueData;

      if (attendDto.sessionId) {
        // Attend specific customer by sessionId
        this.logger.log(`Attending customer with sessionId ${attendDto.sessionId} by user ${user.id}`);
        queueData = await this.queueService.findQueueBySessionId(attendDto.sessionId);
        
        // Check if customer is waiting
        if (queueData.status !== QueueStatus.WAITING) {
          throw new BadRequestException(`Customer with sessionId ${attendDto.sessionId} is not waiting in queue`);
        }
      } else {
        // Get the oldest waiting customer
        this.logger.log(`Getting oldest waiting customer for user ${user.id}`);
        const waitingQueues = await this.queueService.findAllQueue({
          status: QueueStatus.WAITING,
          page: '1',
          limit: '1000', // Get all to sort by createdAt
        });

        if (waitingQueues.total === 0 || waitingQueues.data.length === 0) {
          throw new NotFoundException('No customers waiting in queue');
        }

        // Sort by createdAt (oldest first) and get the first one
        const sortedQueues = waitingQueues.data.sort((a, b) => {
          return a.createdAt.getTime() - b.createdAt.getTime();
        });

        const oldestQueue = sortedQueues[0];
        queueData = await this.queueService.findQueueBySessionId(oldestQueue.sessionId);
      }

      // Update queue: assign to user and change status to SERVICE
      await this.queueService.assignToAgent(queueData.sessionId, user.id);

      // Get updated queue data
      const updatedQueueData = await this.queueService.findQueueBySessionId(queueData.sessionId);

      // Get customer data for sending message
      const customerData = await this.getCustomerDataForMessage(queueData.sessionId);

      // Create attend message
      const userName = user.name || user.login;
      const attendMessage = `*${userName}* iniciou o atendimento`;

      // Send system message to customer
      await this.sendSystemMessage(
        queueData.sessionId,
        customerData,
        attendMessage,
        user,
      );

      this.logger.log(`Customer ${queueData.customerId} attended by user ${user.id}`);

      return {
        sessionId: queueData.sessionId,
        customerId: queueData.customerId,
        userId: user.id,
        userName,
        attendMessage,
        message: 'Service started successfully',
      };
    } catch (error) {
      this.logger.error(`Error attending customer:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to attend customer: ${error.message}`);
    }
  }

  /**
   * Start service for a customer by sending HSM message and creating queue entry
   */
  async startService(startServiceDto: StartServiceDto, user: User): Promise<StartServiceResponseDto> {
    try {
      this.logger.log(`Starting service for customer ${startServiceDto.customerId} with template ${startServiceDto.templateCode} by user ${user.id}`);

      // Get customer by ID
      const customer = await this.customerService.findCustomerById(startServiceDto.customerId);

      // Check if customer is already in service
      const isInService = await this.queueService.isCustomerInService(startServiceDto.customerId);
      if (isInService) {
        throw new BadRequestException('Customer is already in service');
      }

      // Validate customer has WhatsApp contact
      if (!customer.contact && !customer.platformId) {
        throw new BadRequestException('Customer must have a contact or platformId to start service');
      }

      // Generate sessionId using UUID (same pattern as webhook service)
      const sessionId = randomUUID();

      // Get phone number for sending message (remove @s.whatsapp.net if present)
      const phoneNumber = customer.contact || customer.platformId?.replace('@s.whatsapp.net', '');
      if (!phoneNumber) {
        throw new BadRequestException('Customer must have a valid phone number to send HSM message');
      }

      // Send HSM message using Otima service
      let messageSent = false;
      let platformResponse: any = null;
      let platformMessageId: string | null = null;
      let sendSuccess = false;
      
      try {
        const otimaResponse = await this.otimaService.sendTemplateMessage({
          to: phoneNumber,
          templateId: startServiceDto.templateCode,
          parameters: startServiceDto.parameters || [],
        });
        
        platformResponse = otimaResponse;
        platformMessageId = otimaResponse.messageId || null;
        sendSuccess = true;
        messageSent = true;
        this.logger.log(`HSM message sent successfully to ${phoneNumber} with template ${startServiceDto.templateCode}. Message ID: ${platformMessageId}`);
      } catch (error) {
        this.logger.error(`Failed to send HSM message to ${phoneNumber}:`, error);
        throw new BadRequestException(`Failed to send HSM message: ${error.message}`);
      }

      // Create queue entry to start the session
      const queueData: CreateQueueWhatsAppDto = {
        sessionId,
        customerId: customer.id,
        customer,
        userId: user.id,
        user,
        attendedAt: new Date().toISOString(),
        metadata: {
          instance: 'default',
          number: phoneNumber,
          platform: 'otima',
          direction: 'outbound', // Outbound since user initiated
        },
      };

      // Check if queue entry already exists
      try {
        const existingQueue = await this.queueService.findQueueBySessionId(sessionId);
        // If exists, update it to SERVICE status
        await this.queueService.updateQueue(sessionId, {
          sessionId,
          userId: user.id,
          status: QueueStatus.SERVICE,
          attendedAt: new Date().toISOString(),
        });
        this.logger.log(`Updated existing queue entry for session ${sessionId}`);
      } catch (error) {
        // Queue doesn't exist, create new one
        if (error instanceof NotFoundException) {
          await this.queueService.createQueueWhatsApp(queueData);
          // Update status to SERVICE after creation
          await this.queueService.updateStatus(sessionId, QueueStatus.SERVICE, new Date());
          this.logger.log(`Created new queue entry for session ${sessionId}`);
        } else {
          throw error;
        }
      }

      // Store the sent HSM message in the session with content from template service
      try {
        // Generate a unique message ID if not provided by platform
        const messageId = platformMessageId || this.generateMessageId(MessagePlatform.WHATSAPP);

        // Fetch template from our template service to get content and button info for storage
        const template = await this.templatesService.findTemplateByCode(startServiceDto.templateCode);
        const resolvedMessage = template
          ? this.resolveTemplateContent(template.content, startServiceDto.parameters)
          : undefined;

        // Build template metadata: body parameters plus button definitions when present
        const templateParameters = startServiceDto.parameters || [];
        const templateButtons = template?.buttonSample?.length
          ? template.buttonSample.map((btn) => ({
              type: btn.tipo_botao,
              text: btn.texto_botao,
            }))
          : [];

        // Create platform message data for the HSM template message
        const platformMessageData: PlatformMessageData = {
          messageId,
          sessionId,
          senderType: SenderType.USER,
          recipientType: RecipientType.CUSTOMER,
          customerId: customer.id,
          userId: user.id,
          fromMe: true,
          system: false,
          isGroup: customer.isGroup || false,
          message: resolvedMessage ?? undefined,
          media: undefined,
          type: MessageType.TEXT,
          platform: MessagePlatform.WHATSAPP,
          status: sendSuccess ? MessageStatus.SENT : MessageStatus.FAILED,
          metadata: {
            ...platformResponse,
            templateCode: startServiceDto.templateCode,
            templateParameters,
            ...(templateButtons.length > 0 && { templateButtons }),
            isTemplateMessage: true,
            sentByUser: {
              id: user.id,
              name: user.name,
              login: user.login,
              profile: user.profile,
            },
          },
        };

        // Store the message using the message storage service
        const result = await this.messageStorageService.storeMessage(platformMessageData);
        this.logger.log(`HSM template message stored successfully. PostgreSQL ID: ${result.postgresMessage.id}, Message ID: ${messageId}`);
        
        // Update the last message in the queue (same pattern as webhook service)
        await this.queueService.updateLastMessage(sessionId, result.redisMessage);
        this.logger.log(`Last message updated in queue for session ${sessionId}`);
      } catch (storageError) {
        // Log error but don't fail the service start if message storage fails
        this.logger.error(`Failed to store HSM template message for session ${sessionId}:`, storageError);
      }

      this.logger.log(`Service started successfully for customer ${startServiceDto.customerId} with session ${sessionId}`);

      return {
        sessionId,
        customerId: customer.id,
        userId: user.id,
        templateCode: startServiceDto.templateCode,
        messageSent,
        message: 'Service started successfully',
      };
    } catch (error) {
      this.logger.error(`Error starting service for customer ${startServiceDto.customerId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to start service: ${error.message}`);
    }
  }

  /**
   * Resolve template content by replacing {{1}}, {{2}}, ... with the provided parameters.
   * Also supports -var1-, -var2- style placeholders (replaced by parameter index).
   */
  private resolveTemplateContent(content: string, parameters?: string[]): string {
    if (!content) {
      return content;
    }
    if (!parameters || parameters.length === 0) {
      return content;
    }
    let resolved = content;
    // WhatsApp-style {{1}}, {{2}}, ...
    parameters.forEach((value, index) => {
      const placeholder = `{{${index + 1}}}`;
      resolved = resolved.split(placeholder).join(value ?? '');
    });
    // -var1-, -var2-, ... (fallback)
    parameters.forEach((value, index) => {
      const placeholder = `-var${index + 1}-`;
      resolved = resolved.split(placeholder).join(value ?? '');
    });
    return resolved;
  }
}
