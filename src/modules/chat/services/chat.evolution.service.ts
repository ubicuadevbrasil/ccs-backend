import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EvolutionService } from '../../whatsapp/evolution/evolution.service';
import { 
  MessageType, 
  MessagePlatform, 
  MessageStatus, 
  SenderType, 
  RecipientType 
} from '../../messages/entities/message.entity';
import { PlatformMessageData } from '../../messages/platform-mappers';

export interface EvolutionSendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  evolutionResponse?: any;
}

export interface EvolutionMessageData {
  instance: string;
  number: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  messageType: MessageType;
  replyMessageId?: string;
  isGroup: boolean;
}

@Injectable()
export class ChatEvolutionService {
  private readonly logger = new Logger(ChatEvolutionService.name);

  constructor(
    private readonly evolutionService: EvolutionService,
  ) {}

  /**
   * Send a message via Evolution API
   */
  async sendMessage(evolutionData: EvolutionMessageData): Promise<EvolutionSendMessageResult> {
    try {
      this.logger.log(`Sending ${evolutionData.messageType} message via Evolution API to ${evolutionData.number}`);

      // Validate required fields
      this.validateEvolutionData(evolutionData);

      // Send message based on type
      let evolutionResponse: any;

      switch (evolutionData.messageType) {
        case MessageType.TEXT:
          evolutionResponse = await this.sendTextMessage(evolutionData);
          break;
        case MessageType.IMAGE:
          evolutionResponse = await this.sendImageMessage(evolutionData);
          break;
        case MessageType.VIDEO:
          evolutionResponse = await this.sendVideoMessage(evolutionData);
          break;
        case MessageType.AUDIO:
          evolutionResponse = await this.sendAudioMessage(evolutionData);
          break;
        case MessageType.DOCUMENT:
          evolutionResponse = await this.sendDocumentMessage(evolutionData);
          break;
        case MessageType.LOCATION:
          evolutionResponse = await this.sendLocationMessage(evolutionData);
          break;
        case MessageType.CONTACT:
          evolutionResponse = await this.sendContactMessage(evolutionData);
          break;
        case MessageType.STICKER:
          evolutionResponse = await this.sendStickerMessage(evolutionData);
          break;
        default:
          throw new BadRequestException(`Unsupported message type: ${evolutionData.messageType}`);
      }

      // Extract message ID from Evolution response
      const messageId = this.extractMessageId(evolutionResponse);

      this.logger.log(`Message sent successfully via Evolution API. Message ID: ${messageId}`);

      return {
        success: true,
        messageId,
        evolutionResponse,
      };
    } catch (error) {
      this.logger.error(`Error sending message via Evolution API:`, error);
      return {
        success: false,
        error: error.message || 'Failed to send message via Evolution API',
      };
    }
  }

  /**
   * Send text message
   */
  private async sendTextMessage(evolutionData: EvolutionMessageData): Promise<any> {
    if (!evolutionData.text) {
      throw new BadRequestException('Text is required for text messages');
    }

    const textData = {
      number: evolutionData.number,
      text: evolutionData.text,
    };

    // Add reply message ID if provided
    if (evolutionData.replyMessageId) {
      textData['quoted'] = {
        key: {
          id: evolutionData.replyMessageId,
        },
      };
    }

    return await this.evolutionService.sendText(evolutionData.instance, textData);
  }

  /**
   * Send image message
   */
  private async sendImageMessage(evolutionData: EvolutionMessageData): Promise<any> {
    if (!evolutionData.mediaUrl) {
      throw new BadRequestException('Media URL is required for image messages');
    }

    const mediaData = {
      number: evolutionData.number,
      mediatype: 'image' as const,
      mimetype: this.getMimeTypeFromUrl(evolutionData.mediaUrl) || 'image/jpeg',
      media: evolutionData.mediaUrl,
      fileName: this.extractFileName(evolutionData.mediaUrl) || 'image.jpg',
      caption: evolutionData.text || '',
    };

    // Add reply message ID if provided
    if (evolutionData.replyMessageId) {
      mediaData['quoted'] = {
        key: {
          id: evolutionData.replyMessageId,
        },
      };
    }

    return await this.evolutionService.sendMedia(evolutionData.instance, mediaData);
  }

  /**
   * Send video message
   */
  private async sendVideoMessage(evolutionData: EvolutionMessageData): Promise<any> {
    if (!evolutionData.mediaUrl) {
      throw new BadRequestException('Media URL is required for video messages');
    }

    const videoData = {
      number: evolutionData.number,
      video: evolutionData.mediaUrl,
      caption: evolutionData.text || '',
    };

    return await this.evolutionService.sendVideo(evolutionData.instance, videoData);
  }

  /**
   * Send audio message
   */
  private async sendAudioMessage(evolutionData: EvolutionMessageData): Promise<any> {
    if (!evolutionData.mediaUrl) {
      throw new BadRequestException('Media URL is required for audio messages');
    }

    const audioData = {
      number: evolutionData.number,
      audio: evolutionData.mediaUrl,
    };

    // Add reply message ID if provided
    if (evolutionData.replyMessageId) {
      audioData['quoted'] = {
        key: {
          id: evolutionData.replyMessageId,
        },
      };
    }

    return await this.evolutionService.sendAudio(evolutionData.instance, audioData);
  }

  /**
   * Send document message
   */
  private async sendDocumentMessage(evolutionData: EvolutionMessageData): Promise<any> {
    if (!evolutionData.mediaUrl) {
      throw new BadRequestException('Media URL is required for document messages');
    }

    const documentData = {
      number: evolutionData.number,
      mediatype: 'document' as const,
      mimetype: this.getMimeTypeFromUrl(evolutionData.mediaUrl) || 'application/pdf',
      media: evolutionData.mediaUrl,
      fileName: this.extractFileName(evolutionData.mediaUrl) || 'document.pdf',
      caption: evolutionData.text || '',
    };

    // Add reply message ID if provided
    if (evolutionData.replyMessageId) {
      documentData['quoted'] = {
        key: {
          id: evolutionData.replyMessageId,
        },
      };
    }

    return await this.evolutionService.sendMedia(evolutionData.instance, documentData);
  }

  /**
   * Send location message
   */
  private async sendLocationMessage(evolutionData: EvolutionMessageData): Promise<any> {
    // For location messages, we need to parse the location data from the message
    const locationData = this.parseLocationData(evolutionData.text || '');
    
    if (!locationData) {
      throw new BadRequestException('Invalid location data');
    }

    const locationPayload = {
      number: evolutionData.number,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      name: locationData.name || '',
      address: locationData.address || '',
    };

    return await this.evolutionService.sendLocation(evolutionData.instance, locationPayload);
  }

  /**
   * Send contact message
   */
  private async sendContactMessage(evolutionData: EvolutionMessageData): Promise<any> {
    // For contact messages, we need to parse the contact data from the message
    const contactData = this.parseContactData(evolutionData.text || '');
    
    if (!contactData) {
      throw new BadRequestException('Invalid contact data');
    }

    const contactPayload = {
      number: evolutionData.number,
      contact: [contactData],
    };

    return await this.evolutionService.sendContact(evolutionData.instance, contactPayload);
  }

  /**
   * Send sticker message
   */
  private async sendStickerMessage(evolutionData: EvolutionMessageData): Promise<any> {
    if (!evolutionData.mediaUrl) {
      throw new BadRequestException('Media URL is required for sticker messages');
    }

    const stickerData = {
      number: evolutionData.number,
      sticker: evolutionData.mediaUrl,
    };

    return await this.evolutionService.sendSticker(evolutionData.instance, stickerData);
  }

  /**
   * Validate Evolution API data
   */
  private validateEvolutionData(evolutionData: EvolutionMessageData): void {
    if (!evolutionData.instance) {
      throw new BadRequestException('Evolution instance is required');
    }

    if (!evolutionData.number) {
      throw new BadRequestException('Phone number is required');
    }

    if (!evolutionData.text && !evolutionData.mediaUrl) {
      throw new BadRequestException('Either text or media URL is required');
    }

    if (evolutionData.messageType === MessageType.IMAGE && !evolutionData.mediaUrl) {
      throw new BadRequestException('Media URL is required for image messages');
    }

    if (evolutionData.messageType === MessageType.VIDEO && !evolutionData.mediaUrl) {
      throw new BadRequestException('Media URL is required for video messages');
    }

    if (evolutionData.messageType === MessageType.AUDIO && !evolutionData.mediaUrl) {
      throw new BadRequestException('Media URL is required for audio messages');
    }

    if (evolutionData.messageType === MessageType.DOCUMENT && !evolutionData.mediaUrl) {
      throw new BadRequestException('Media URL is required for document messages');
    }

    if (evolutionData.messageType === MessageType.STICKER && !evolutionData.mediaUrl) {
      throw new BadRequestException('Media URL is required for sticker messages');
    }
  }

  /**
   * Extract message ID from Evolution API response
   */
  private extractMessageId(evolutionResponse: any): string {
    // Evolution API typically returns the message ID in the response
    // The exact structure may vary, so we need to handle different response formats
    if (evolutionResponse?.key?.id) {
      return evolutionResponse.key.id;
    }

    if (evolutionResponse?.messageId) {
      return evolutionResponse.messageId;
    }

    if (evolutionResponse?.id) {
      return evolutionResponse.id;
    }

    // If no message ID is found, generate one
    return `evolution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract file name from URL
   */
  private extractFileName(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop();
      return fileName || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get MIME type from URL
   */
  private getMimeTypeFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      
      if (pathname.includes('.jpg') || pathname.includes('.jpeg')) {
        return 'image/jpeg';
      } else if (pathname.includes('.png')) {
        return 'image/png';
      } else if (pathname.includes('.gif')) {
        return 'image/gif';
      } else if (pathname.includes('.mp4')) {
        return 'video/mp4';
      } else if (pathname.includes('.avi')) {
        return 'video/avi';
      } else if (pathname.includes('.mov')) {
        return 'video/quicktime';
      } else if (pathname.includes('.mp3')) {
        return 'audio/mpeg';
      } else if (pathname.includes('.wav')) {
        return 'audio/wav';
      } else if (pathname.includes('.ogg')) {
        return 'audio/ogg';
      } else if (pathname.includes('.pdf')) {
        return 'application/pdf';
      } else if (pathname.includes('.doc')) {
        return 'application/msword';
      } else if (pathname.includes('.docx')) {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else {
        return 'application/octet-stream';
      }
    } catch (error) {
      return 'application/octet-stream';
    }
  }

  /**
   * Parse location data from text
   */
  private parseLocationData(text: string): { latitude: number; longitude: number; name?: string; address?: string } | null {
    try {
      // Expected format: "lat:123.456,lng:78.901,name:Location Name,address:Address"
      const parts = text.split(',');
      const locationData: any = {};

      for (const part of parts) {
        const [key, value] = part.split(':');
        if (key === 'lat') {
          locationData.latitude = parseFloat(value);
        } else if (key === 'lng') {
          locationData.longitude = parseFloat(value);
        } else if (key === 'name') {
          locationData.name = value;
        } else if (key === 'address') {
          locationData.address = value;
        }
      }

      if (locationData.latitude && locationData.longitude) {
        return locationData;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse contact data from text
   */
  private parseContactData(text: string): { fullName: string; wuid: string; phoneNumber: string } | null {
    try {
      // Expected format: "name:Contact Name,number:+1234567890"
      const parts = text.split(',');
      const contactData: any = {};

      for (const part of parts) {
        const [key, value] = part.split(':');
        if (key === 'name') {
          contactData.fullName = value;
          contactData.wuid = value; // Use name as wuid for simplicity
        } else if (key === 'number') {
          contactData.phoneNumber = value;
        }
      }

      if (contactData.fullName && contactData.phoneNumber) {
        return contactData;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if Evolution instance is connected
   */
  async checkInstanceConnection(instance: string): Promise<boolean> {
    try {
      const connectionState = await this.evolutionService.getConnectionState(instance);
      return connectionState?.instance?.connectionStatus === 'open';
    } catch (error) {
      this.logger.error(`Error checking Evolution instance connection:`, error);
      return false;
    }
  }

  /**
   * Get Evolution instance information
   */
  async getInstanceInfo(instance: string): Promise<any> {
    try {
      return await this.evolutionService.fetchInstances(undefined, instance);
    } catch (error) {
      this.logger.error(`Error getting Evolution instance info:`, error);
      throw error;
    }
  }
}
