import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MessageStorageService } from '../messages/message-storage.service';
import { User } from '../user/entities/user.entity';
import { UserProfile, UserStatus } from '../user/entities/user.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagePlatform, MessageType, MessageStatus, SenderType, RecipientType } from '../messages/entities/message.entity';

describe('ChatController', () => {
  let controller: ChatController;
  let service: ChatService;
  let messageStorageService: MessageStorageService;

  const mockUser: User = new User({
    id: 'user-123',
    login: 'test.user',
    name: 'Test User',
    email: 'test@example.com',
    contact: '+1234567890',
    status: UserStatus.ACTIVE,
    profile: UserProfile.OPERATOR,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockSendMessageDto: SendMessageDto = {
    sessionId: 'session-123',
    platform: MessagePlatform.WHATSAPP,
    customerId: 'customer-123',
    message: 'Hello, how can I help you?',
    type: MessageType.TEXT,
    isGroup: false,
  };

  const mockMessageResponse = {
    id: 'msg-123',
    messageId: 'whatsapp_123456789_abc123',
    sessionId: 'session-123',
    senderType: SenderType.USER,
    recipientType: RecipientType.CUSTOMER,
    customerId: 'customer-123',
    userId: 'user-123',
    fromMe: true,
    system: false,
    isGroup: false,
    message: 'Hello, how can I help you?',
    media: undefined,
    type: MessageType.TEXT,
    platform: MessagePlatform.WHATSAPP,
    status: MessageStatus.PENDING,
    metadata: {},
    replyMessageId: undefined,
    sentAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockMessageStorageService = {
      storeMessage: jest.fn().mockResolvedValue({
        redisMessage: mockMessageResponse,
        postgresMessage: mockMessageResponse,
      }),
      getSessionMessages: jest.fn().mockResolvedValue([mockMessageResponse]),
      getSessionStatistics: jest.fn().mockResolvedValue({
        redisCount: 5,
        postgresCount: 10,
        lastMessageAt: '2024-01-01T10:00:00.000Z',
        firstMessageAt: '2024-01-01T09:00:00.000Z',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        ChatService,
        {
          provide: MessageStorageService,
          useValue: mockMessageStorageService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    service = module.get<ChatService>(ChatService);
    messageStorageService = module.get<MessageStorageService>(MessageStorageService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const result = await controller.sendMessage(mockSendMessageDto, mockUser);

      expect(result).toEqual(mockMessageResponse);
      expect(messageStorageService.storeMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: expect.any(String),
          sessionId: mockSendMessageDto.sessionId,
          senderType: SenderType.USER,
          recipientType: RecipientType.CUSTOMER,
          customerId: mockSendMessageDto.customerId,
          userId: mockUser.id,
          fromMe: true,
          system: false,
          isGroup: false,
          message: mockSendMessageDto.message,
          type: MessageType.TEXT,
          platform: MessagePlatform.WHATSAPP,
          status: MessageStatus.PENDING,
        })
      );
    });
  });

  describe('getChatHistory', () => {
    it('should get chat history successfully', async () => {
      const result = await controller.getChatHistory('session-123', '50');

      expect(result).toEqual({
        sessionId: 'session-123',
        messages: [mockMessageResponse],
        count: 1,
      });
      expect(messageStorageService.getSessionMessages).toHaveBeenCalledWith('session-123', 50);
    });
  });

  describe('getSessionStatistics', () => {
    it('should get session statistics successfully', async () => {
      const result = await controller.getSessionStatistics('session-123');

      expect(result).toEqual({
        sessionId: 'session-123',
        redisCount: 5,
        postgresCount: 10,
        lastMessageAt: '2024-01-01T10:00:00.000Z',
        firstMessageAt: '2024-01-01T09:00:00.000Z',
      });
      expect(messageStorageService.getSessionStatistics).toHaveBeenCalledWith('session-123');
    });
  });
});
