import { Test, TestingModule } from '@nestjs/testing';
import { SocketService } from './socket.service';
import { WebhookService } from '../webhook/webhook.service';
import { MessagesService } from '../messages/messages.service';
import { QueuesService } from '../queues/queues.service';
import { Department } from '../queues/interfaces/queue.interface';
import { MessageFrom, MessageDirection, MessageStatus } from '../messages/interfaces/message.interface';

describe('SocketService', () => {
  let service: SocketService;
  let webhookService: jest.Mocked<WebhookService>;
  let messagesService: jest.Mocked<MessagesService>;
  let queuesService: jest.Mocked<QueuesService>;

  beforeEach(async () => {
    const mockWebhookService = {
      processEvolutionMessage: jest.fn(),
    };

    const mockMessagesService = {
      createMessage: jest.fn(),
      findMessagesBySessionId: jest.fn(),
    };

    const mockQueuesService = {
      findQueueByCustomerPhone: jest.fn(),
      updateQueue: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketService,
        {
          provide: WebhookService,
          useValue: mockWebhookService,
        },
        {
          provide: MessagesService,
          useValue: mockMessagesService,
        },
        {
          provide: QueuesService,
          useValue: mockQueuesService,
        },
      ],
    }).compile();

    service = module.get<SocketService>(SocketService);
    webhookService = module.get(WebhookService);
    messagesService = module.get(MessagesService);
    queuesService = module.get(QueuesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerOperatorConnection', () => {
    it('should register operator connection successfully', () => {
      const mockSocket = {
        join: jest.fn(),
        emit: jest.fn(),
      } as any;

      service.registerOperatorConnection(
        'socket-id-123',
        'operator-123',
        'John Doe',
        Department.PERSONAL,
        mockSocket,
      );

      const operators = service.getConnectedOperators();
      expect(operators).toHaveLength(1);
      expect(operators[0]).toEqual({
        socketId: 'socket-id-123',
        operatorId: 'operator-123',
        operatorName: 'John Doe',
        department: Department.PERSONAL,
        isAvailable: true,
        connectedAt: expect.any(Date),
        lastActivity: expect.any(Date),
      });
    });
  });

  describe('removeOperatorConnection', () => {
    it('should remove operator connection successfully', () => {
      const mockSocket = {
        join: jest.fn(),
        emit: jest.fn(),
      } as any;

      // Register operator first
      service.registerOperatorConnection(
        'socket-id-123',
        'operator-123',
        'John Doe',
        Department.PERSONAL,
        mockSocket,
      );

      expect(service.getConnectedOperators()).toHaveLength(1);

      // Remove operator
      service.removeOperatorConnection('socket-id-123');

      expect(service.getConnectedOperators()).toHaveLength(0);
    });
  });

  describe('getAvailableOperatorsByDepartment', () => {
    it('should return available operators for specific department', () => {
      const mockSocket1 = { join: jest.fn(), emit: jest.fn() } as any;
      const mockSocket2 = { join: jest.fn(), emit: jest.fn() } as any;

      // Register operators
      service.registerOperatorConnection(
        'socket-id-1',
        'operator-1',
        'John Doe',
        Department.PERSONAL,
        mockSocket1,
      );

      service.registerOperatorConnection(
        'socket-id-2',
        'operator-2',
        'Jane Smith',
        Department.FISCAL,
        mockSocket2,
      );

      const personalOperators = service.getAvailableOperatorsByDepartment(Department.PERSONAL);
      expect(personalOperators).toHaveLength(1);
      expect(personalOperators[0].operatorId).toBe('operator-1');

      const fiscalOperators = service.getAvailableOperatorsByDepartment(Department.FISCAL);
      expect(fiscalOperators).toHaveLength(1);
      expect(fiscalOperators[0].operatorId).toBe('operator-2');
    });
  });

  describe('updateOperatorStatus', () => {
    it('should update operator status successfully', () => {
      const mockSocket = { join: jest.fn(), emit: jest.fn() } as any;

      service.registerOperatorConnection(
        'socket-id-123',
        'operator-123',
        'John Doe',
        Department.PERSONAL,
        mockSocket,
      );

      service.updateOperatorStatus('operator-123', false, 'queue-456');

      const operators = service.getConnectedOperators();
      expect(operators[0].isAvailable).toBe(false);
      expect(operators[0].currentQueueId).toBe('queue-456');
    });
  });

  describe('handleWebhookEvent', () => {
    it('should process webhook event successfully', async () => {
      const mockWebhookData = {
        event: 'messages.upsert',
        instance: 'instance-1',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: false,
            id: 'message-id',
          },
          message: {
            conversation: 'Hello, I need help',
          },
          messageTimestamp: 1234567890,
        },
      };

      webhookService.processEvolutionMessage.mockResolvedValue({
        success: true,
        message: 'Processed successfully',
      });

      await service.handleWebhookEvent(mockWebhookData);

      expect(webhookService.processEvolutionMessage).toHaveBeenCalledWith(mockWebhookData);
    });

    it('should handle webhook processing errors', async () => {
      const mockWebhookData = {
        event: 'messages.upsert',
        instance: 'instance-1',
        data: {},
      };

      webhookService.processEvolutionMessage.mockResolvedValue({
        success: false,
        message: 'Processing failed',
      });

      await service.handleWebhookEvent(mockWebhookData);

      expect(webhookService.processEvolutionMessage).toHaveBeenCalledWith(mockWebhookData);
    });
  });

  describe('extractMessageContent', () => {
    it('should extract conversation content', () => {
      const message = { conversation: 'Hello world' };
      const content = (service as any).extractMessageContent(message);
      expect(content).toBe('Hello world');
    });

    it('should extract image caption', () => {
      const message = { imageMessage: { caption: 'Image caption' } };
      const content = (service as any).extractMessageContent(message);
      expect(content).toBe('Image caption');
    });

    it('should return media message for media without caption', () => {
      const message = { imageMessage: {} };
      const content = (service as any).extractMessageContent(message);
      expect(content).toBe('[Media Message]');
    });
  });

  describe('getMessageType', () => {
    it('should identify conversation type', () => {
      const message = { conversation: 'Hello' };
      const type = (service as any).getMessageType(message);
      expect(type).toBe('conversation');
    });

    it('should identify image message type', () => {
      const message = { imageMessage: {} };
      const type = (service as any).getMessageType(message);
      expect(type).toBe('imageMessage');
    });

    it('should return unknown for unrecognized type', () => {
      const message = { unknownType: {} };
      const type = (service as any).getMessageType(message);
      expect(type).toBe('unknown');
    });
  });

  describe('mapMessageStatus', () => {
    it('should map SENT status correctly', () => {
      const status = (service as any).mapMessageStatus('SENT');
      expect(status).toBe(MessageStatus.SENT);
    });

    it('should map DELIVERED status correctly', () => {
      const status = (service as any).mapMessageStatus('DELIVERED');
      expect(status).toBe(MessageStatus.DELIVERED);
    });

    it('should map READ status correctly', () => {
      const status = (service as any).mapMessageStatus('READ');
      expect(status).toBe(MessageStatus.READ);
    });

    it('should map FAILED status correctly', () => {
      const status = (service as any).mapMessageStatus('FAILED');
      expect(status).toBe(MessageStatus.FAILED);
    });

    it('should default to PENDING for unknown status', () => {
      const status = (service as any).mapMessageStatus('UNKNOWN');
      expect(status).toBe(MessageStatus.PENDING);
    });
  });
}); 