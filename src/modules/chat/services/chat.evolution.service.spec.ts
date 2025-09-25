import { Test, TestingModule } from '@nestjs/testing';
import { ChatEvolutionService } from './chat.evolution.service';
import { EvolutionService } from '../../whatsapp/evolution/evolution.service';
import { MessageType, MessagePlatform, MessageStatus, SenderType, RecipientType } from '../../messages/entities/message.entity';
import { PlatformMessageData } from '../../messages/platform-mappers';
import { EvolutionMessageData } from './chat.evolution.service';

describe('ChatEvolutionService', () => {
  let service: ChatEvolutionService;
  let evolutionService: EvolutionService;

  const mockPlatformMessageData: PlatformMessageData = {
    messageId: 'test_message_123',
    sessionId: 'session_123',
    senderType: SenderType.USER,
    recipientType: RecipientType.CUSTOMER,
    customerId: 'customer_123',
    userId: 'user_123',
    fromMe: true,
    system: false,
    isGroup: false,
    message: 'Hello, this is a test message',
    type: MessageType.TEXT,
    platform: MessagePlatform.WHATSAPP,
    status: MessageStatus.PENDING,
    metadata: {},
  };

  const mockEvolutionData: EvolutionMessageData = {
    instance: 'test_instance',
    number: '+1234567890',
    text: 'Hello, this is a test message',
    messageType: MessageType.TEXT,
    isGroup: false,
  };

  beforeEach(async () => {
    const mockEvolutionService = {
      sendText: jest.fn().mockResolvedValue({ key: { id: 'evolution_msg_123' } }),
      sendMedia: jest.fn().mockResolvedValue({ key: { id: 'evolution_msg_123' } }),
      sendVideo: jest.fn().mockResolvedValue({ key: { id: 'evolution_msg_123' } }),
      sendAudio: jest.fn().mockResolvedValue({ key: { id: 'evolution_msg_123' } }),
      sendLocation: jest.fn().mockResolvedValue({ key: { id: 'evolution_msg_123' } }),
      sendContact: jest.fn().mockResolvedValue({ key: { id: 'evolution_msg_123' } }),
      sendSticker: jest.fn().mockResolvedValue({ key: { id: 'evolution_msg_123' } }),
      getConnectionState: jest.fn().mockResolvedValue({ instance: { connectionStatus: 'open' } }),
      fetchInstances: jest.fn().mockResolvedValue([{ instanceName: 'test_instance' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatEvolutionService,
        {
          provide: EvolutionService,
          useValue: mockEvolutionService,
        },
      ],
    }).compile();

    service = module.get<ChatEvolutionService>(ChatEvolutionService);
    evolutionService = module.get<EvolutionService>(EvolutionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should send text message successfully', async () => {
      const result = await service.sendMessage(mockPlatformMessageData, mockEvolutionData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('evolution_msg_123');
      expect(evolutionService.sendText).toHaveBeenCalledWith('test_instance', {
        number: '+1234567890',
        text: 'Hello, this is a test message',
      });
    });

    it('should send image message successfully', async () => {
      const imageData = {
        ...mockEvolutionData,
        mediaUrl: 'https://example.com/image.jpg',
        messageType: MessageType.IMAGE,
      };

      const imagePlatformData = {
        ...mockPlatformMessageData,
        type: MessageType.IMAGE,
        media: 'https://example.com/image.jpg',
      };

      const result = await service.sendMessage(imagePlatformData, imageData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('evolution_msg_123');
      expect(evolutionService.sendMedia).toHaveBeenCalledWith('test_instance', {
        number: '+1234567890',
        mediatype: 'image',
        mimetype: 'image/jpeg',
        media: 'https://example.com/image.jpg',
        fileName: 'image.jpg',
        caption: '',
      });
    });

    it('should send video message successfully', async () => {
      const videoData = {
        ...mockEvolutionData,
        mediaUrl: 'https://example.com/video.mp4',
        messageType: MessageType.VIDEO,
      };

      const videoPlatformData = {
        ...mockPlatformMessageData,
        type: MessageType.VIDEO,
        media: 'https://example.com/video.mp4',
      };

      const result = await service.sendMessage(videoPlatformData, videoData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('evolution_msg_123');
      expect(evolutionService.sendVideo).toHaveBeenCalledWith('test_instance', {
        number: '+1234567890',
        video: 'https://example.com/video.mp4',
        caption: '',
      });
    });

    it('should send audio message successfully', async () => {
      const audioData = {
        ...mockEvolutionData,
        mediaUrl: 'https://example.com/audio.mp3',
        messageType: MessageType.AUDIO,
      };

      const audioPlatformData = {
        ...mockPlatformMessageData,
        type: MessageType.AUDIO,
        media: 'https://example.com/audio.mp3',
      };

      const result = await service.sendMessage(audioPlatformData, audioData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('evolution_msg_123');
      expect(evolutionService.sendAudio).toHaveBeenCalledWith('test_instance', {
        number: '+1234567890',
        audio: 'https://example.com/audio.mp3',
      });
    });

    it('should send document message successfully', async () => {
      const documentData = {
        ...mockEvolutionData,
        mediaUrl: 'https://example.com/document.pdf',
        messageType: MessageType.DOCUMENT,
      };

      const documentPlatformData = {
        ...mockPlatformMessageData,
        type: MessageType.DOCUMENT,
        media: 'https://example.com/document.pdf',
      };

      const result = await service.sendMessage(documentPlatformData, documentData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('evolution_msg_123');
      expect(evolutionService.sendMedia).toHaveBeenCalledWith('test_instance', {
        number: '+1234567890',
        mediatype: 'document',
        mimetype: 'application/pdf',
        media: 'https://example.com/document.pdf',
        fileName: 'document.pdf',
        caption: '',
      });
    });

    it('should handle Evolution API errors gracefully', async () => {
      evolutionService.sendText.mockRejectedValue(new Error('Evolution API error'));

      const result = await service.sendMessage(mockPlatformMessageData, mockEvolutionData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Evolution API error');
    });

    it('should throw error for unsupported message type', async () => {
      const unsupportedData = {
        ...mockEvolutionData,
        messageType: MessageType.OTHER,
      };

      const unsupportedPlatformData = {
        ...mockPlatformMessageData,
        type: MessageType.OTHER,
      };

      const result = await service.sendMessage(unsupportedPlatformData, unsupportedData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported message type');
    });
  });

  describe('checkInstanceConnection', () => {
    it('should return true when instance is connected', async () => {
      const result = await service.checkInstanceConnection('test_instance');

      expect(result).toBe(true);
      expect(evolutionService.getConnectionState).toHaveBeenCalledWith('test_instance');
    });

    it('should return false when instance is not connected', async () => {
      evolutionService.getConnectionState.mockResolvedValue({ instance: { connectionStatus: 'closed' } });

      const result = await service.checkInstanceConnection('test_instance');

      expect(result).toBe(false);
    });

    it('should return false when Evolution service throws error', async () => {
      evolutionService.getConnectionState.mockRejectedValue(new Error('Connection error'));

      const result = await service.checkInstanceConnection('test_instance');

      expect(result).toBe(false);
    });
  });

  describe('getInstanceInfo', () => {
    it('should return instance information', async () => {
      const result = await service.getInstanceInfo('test_instance');

      expect(result).toEqual([{ instanceName: 'test_instance' }]);
      expect(evolutionService.fetchInstances).toHaveBeenCalledWith(undefined, 'test_instance');
    });

    it('should throw error when Evolution service fails', async () => {
      evolutionService.fetchInstances.mockRejectedValue(new Error('Fetch error'));

      await expect(service.getInstanceInfo('test_instance')).rejects.toThrow('Fetch error');
    });
  });
});
