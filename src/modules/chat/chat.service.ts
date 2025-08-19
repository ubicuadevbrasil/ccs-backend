import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { EvolutionService } from '../evolution/evolution.service';
import { MessagesService } from '../messages/messages.service';
import { QueuesService } from '../queues/queues.service';
import { MessageFrom, MessageDirection, MessageType, MessageStatus } from '../messages/interfaces/message.interface';
import {
  SendTextDto,
  SendMediaDto,
  SendAudioDto,
  SendLocationDto,
  SendContactDto,
  SendReactionDto,
  SendStickerDto,
  SendStatusDto,
  CheckWhatsAppNumbersDto,
  MarkMessagesAsReadDto,
  ArchiveChatDto,
  MarkChatUnreadDto,
  DeleteMessageDto,
  FetchProfilePictureDto,
  GetBase64FromMediaMessageDto,
  UpdateMessageDto,
  SendPresenceDto,
  UpdateBlockStatusDto,
  FindContactsDto,
  FindMessagesDto,
  FindStatusMessageDto,
  FindChatsDto,
  FetchBusinessProfileDto,
  FetchProfileDto,
  UpdateProfileNameDto,
  UpdateProfileStatusDto,
  UpdateProfilePictureDto,
  UpdatePrivacySettingsDto,
  FindLabelsDto,
  HandleLabelDto,
  FakeCallDto,
  SendTemplateDto,
  GetMediaDto,
  GetMediaUrlDto,
} from './dto/chat.dto';
import { SendVideoDto } from '../evolution/interfaces/evolution.interface';

interface OperatorData {
  id: string;
  name: string;
  login: string;
  email: string;
  profile: string;
  department: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly evolutionService: EvolutionService,
    private readonly messagesService: MessagesService,
    @Inject(forwardRef(() => QueuesService))
    private readonly queuesService: QueuesService
  ) { }

  // Message Sending Methods
  async sendText(data: SendTextDto, operatorData?: OperatorData) {
    this.logger.log(`Sending text message to ${data.number} via instance ${data.instance}`);

    const { instance, ...messageData } = data;
    
    // Check if this is a group message and prepend operator name
    let modifiedText = data.text;
    if (operatorData && data.number.includes('@g.us')) {
      modifiedText = `*${operatorData.name}:* ${data.text}`;
      this.logger.log(`Group message detected, prepending operator name: ${operatorData.name}`);
    }
    
    // Create the message data with potentially modified text
    const finalMessageData = {
      ...messageData,
      text: modifiedText
    };
    
    const result = await this.evolutionService.sendText(instance, finalMessageData);

    // Create message record if operator data is provided
    if (operatorData) {
      try {
        // Find queue for this customer
        const customerPhone = data.number.replace('@s.whatsapp.net', '').replace('@g.us', '');
        const queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);

        if (queue) {
          await this.messagesService.createMessage({
            sessionId: queue.sessionId,
            evolutionMessageId: result.key.id,
            messageType: result.messageType,
            remoteJid: result.key.remoteJid,
            instance: data.instance,
            pushName: operatorData.name,
            source: 'chat',
            messageTimestamp: result.messageTimestamp,
            from: MessageFrom.OPERATOR,
            direction: MessageDirection.OUTBOUND,
            content: modifiedText, // Use the modified text for the message record
            status: MessageStatus.PENDING,
            senderId: operatorData.id,
            senderName: operatorData.name,
            evolutionData: { data: result },
            metadata: {
              delay: data.delay,
              quoted: data.quoted,
              linkPreview: data.linkPreview,
              mentionsEveryOne: data.mentionsEveryOne,
              mentioned: data.mentioned,
              originalText: data.text, // Store the original text in metadata
              isGroupMessage: data.number.includes('@g.us')
            }
          });

          this.logger.log(`Created message record for operator ${operatorData.name} (${operatorData.id})`);
        }
      } catch (error) {
        this.logger.error(`Error creating message record: ${error.message}`);
        // Don't fail the entire operation if message record creation fails
      }
    }

    return result;
  }

  async sendMedia(data: SendMediaDto, operatorData?: OperatorData) {
    this.logger.log(`Sending media message to ${data.number} via instance ${data.instance}`);

    const { instance, ...messageData } = data;
    
    // Check if this is a group message and prepend operator name to caption
    let modifiedCaption = data.caption;
    if (operatorData && data.number.includes('@g.us') && data.caption) {
      modifiedCaption = `*${operatorData.name}:* ${data.caption}`;
      this.logger.log(`Group media message detected, prepending operator name to caption: ${operatorData.name}`);
    }
    
    // Create the message data with potentially modified caption
    const finalMessageData = {
      ...messageData,
      caption: modifiedCaption
    };
    
    const result = await this.evolutionService.sendMedia(instance, finalMessageData);
    console.log('sendMedia result', result);
    // Create message record if operator data is provided
    if (operatorData) {
      try {
        // Find queue for this customer
        const customerPhone = data.number.replace('@s.whatsapp.net', '').replace('@g.us', '');
        const queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);

        if (queue) {
          await this.messagesService.createMessage({
            sessionId: queue.sessionId,
            evolutionMessageId: result.key.id,
            messageType: result.messageType,
            remoteJid: result.key.remoteJid,
            instance: data.instance,
            pushName: operatorData.name,
            source: 'chat',
            messageTimestamp: result.messageTimestamp,
            from: MessageFrom.OPERATOR,
            direction: MessageDirection.OUTBOUND,
            content: modifiedCaption, // Use the modified caption for the message record
            mediaUrl: result.message?.mediaUrl,
            mimetype: result.message?.imageMessage?.mimetype || result.message?.videoMessage?.mimetype || result.message?.documentMessage?.mimetype || result.message?.audioMessage?.mimetype,
            caption: modifiedCaption, // Use the modified caption
            fileName: result.message?.documentMessage?.fileName,
            fileLength: result.message?.imageMessage?.fileLength || result.message?.videoMessage?.fileLength || result.message?.documentMessage?.fileLength || result.message?.audioMessage?.fileLength,
            fileSha256: result.message?.imageMessage?.fileSha256 || result.message?.videoMessage?.fileSha256 || result.message?.documentMessage?.fileSha256 || result.message?.audioMessage?.fileSha256,
            width: result.message?.imageMessage?.width || result.message?.videoMessage?.width,
            height: result.message?.imageMessage?.height || result.message?.videoMessage?.height,
            seconds: result.message?.videoMessage?.seconds || result.message?.audioMessage?.seconds,
            isAnimated: result.message?.imageMessage?.isAnimated || result.message?.videoMessage?.isAnimated,
            ptt: result.message?.audioMessage?.ptt,
            status: MessageStatus.PENDING,
            senderId: operatorData.id,
            senderName: operatorData.name,
            evolutionData: { data: result },
            metadata: {
              mediatype: data.mediatype,
              delay: data.delay,
              quoted: data.quoted,
              originalCaption: data.caption, // Store the original caption in metadata
              isGroupMessage: data.number.includes('@g.us')
            }
          });

          this.logger.log(`Created media message record for operator ${operatorData.name} (${operatorData.id})`);
        }
      } catch (error) {
        this.logger.error(`Error creating media message record: ${error.message}`);
        // Don't fail the entire operation if message record creation fails
      }
    }

    return result;
  }

  async sendAudio(data: SendAudioDto, operatorData?: OperatorData) {
    this.logger.log(`Sending audio message to ${data.number} via instance ${data.instance}`);

    const { instance, ...messageData } = data;
    const result = await this.evolutionService.sendAudio(instance, messageData);

    // Create message record if operator data is provided
    if (operatorData) {
      try {
        // Find queue for this customer
        const customerPhone = data.number.replace('@s.whatsapp.net', '').replace('@g.us', '');
        const queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);

        if (queue) {
          // Check if this is a group message and modify content accordingly
          let content = 'Audio message';
          if (data.number.includes('@g.us')) {
            content = `*${operatorData.name}:* ${content}`;
            this.logger.log(`Group audio message detected, prepending operator name: ${operatorData.name}`);
          }

          await this.messagesService.createMessage({
            sessionId: queue.sessionId,
            evolutionMessageId: result.key.id,
            messageType: result.messageType,
            remoteJid: result.key.remoteJid,
            instance: data.instance,
            pushName: operatorData.name,
            source: 'chat',
            messageTimestamp: result.messageTimestamp,
            from: MessageFrom.OPERATOR,
            direction: MessageDirection.OUTBOUND,
            content: content,
            mediaUrl: result.message?.audioMessage?.mediaUrl,
            mimetype: result.message?.audioMessage?.mimetype,
            fileName: result.message?.audioMessage?.fileName,
            fileLength: result.message?.audioMessage?.fileLength,
            fileSha256: result.message?.audioMessage?.fileSha256,
            seconds: result.message?.audioMessage?.seconds,
            ptt: result.message?.audioMessage?.ptt,
            status: MessageStatus.PENDING,
            senderId: operatorData.id,
            senderName: operatorData.name,
            evolutionData: { data: result },
            metadata: {
              audio: data.audio,
              delay: data.delay,
              quoted: data.quoted,
              isGroupMessage: data.number.includes('@g.us')
            }
          });

          this.logger.log(`Created audio message record for operator ${operatorData.name} (${operatorData.id})`);
        }
      } catch (error) {
        this.logger.error(`Error creating audio message record: ${error.message}`);
        // Don't fail the entire operation if message record creation fails
      }
    }

    return result;
  }

  async sendLocation(data: SendLocationDto, operatorData?: OperatorData) {
    this.logger.log(`Sending location message to ${data.number} via instance ${data.instance}`);

    const { instance, ...messageData } = data;
    const result = await this.evolutionService.sendLocation(instance, messageData);

    // Create message record if operator data is provided
    if (operatorData) {
      try {
        // Find queue for this customer
        const customerPhone = data.number.replace('@s.whatsapp.net', '').replace('@g.us', '');
        const queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);

        if (queue) {
          // Check if this is a group message and modify content accordingly
          let content = `${data.name} - ${data.address}`;
          if (data.number.includes('@g.us')) {
            content = `*${operatorData.name}:* ${content}`;
            this.logger.log(`Group location message detected, prepending operator name: ${operatorData.name}`);
          }

          await this.messagesService.createMessage({
            sessionId: queue.sessionId,
            evolutionMessageId: result.key.id,
            messageType: result.messageType,
            remoteJid: result.key.remoteJid,
            instance: data.instance,
            pushName: operatorData.name,
            source: 'chat',
            messageTimestamp: result.messageTimestamp,
            from: MessageFrom.OPERATOR,
            direction: MessageDirection.OUTBOUND,
            content: content,
            status: MessageStatus.PENDING,
            senderId: operatorData.id,
            senderName: operatorData.name,
            evolutionData: { data: result },
            metadata: {
              name: data.name,
              address: data.address,
              latitude: data.latitude,
              longitude: data.longitude,
              delay: data.delay,
              quoted: data.quoted,
              isGroupMessage: data.number.includes('@g.us')
            }
          });

          this.logger.log(`Created location message record for operator ${operatorData.name} (${operatorData.id})`);
        }
      } catch (error) {
        this.logger.error(`Error creating location message record: ${error.message}`);
        // Don't fail the entire operation if message record creation fails
      }
    }

    return result;
  }

  async sendContact(data: SendContactDto, operatorData?: OperatorData) {
    this.logger.log(`Sending contact message to ${data.number} via instance ${data.instance}`);

    const { instance, ...messageData } = data;
    const result = await this.evolutionService.sendContact(instance, messageData);

    // Create message record if operator data is provided
    if (operatorData) {
      try {
        // Find queue for this customer
        const customerPhone = data.number.replace('@s.whatsapp.net', '').replace('@g.us', '');
        const queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);

        if (queue) {
          // Check if this is a group message and modify content accordingly
          let content = 'Contact shared';
          if (data.number.includes('@g.us')) {
            content = `*${operatorData.name}:* ${content}`;
            this.logger.log(`Group contact message detected, prepending operator name: ${operatorData.name}`);
          }

          await this.messagesService.createMessage({
            sessionId: queue.sessionId,
            evolutionMessageId: result.key.id,
            messageType: result.messageType,
            remoteJid: result.key.remoteJid,
            instance: data.instance,
            pushName: operatorData.name,
            source: 'chat',
            messageTimestamp: result.messageTimestamp,
            from: MessageFrom.OPERATOR,
            direction: MessageDirection.OUTBOUND,
            content: content,
            status: MessageStatus.PENDING,
            senderId: operatorData.id,
            senderName: operatorData.name,
            evolutionData: { data: result },
            metadata: {
              contact: data.contact,
              isGroupMessage: data.number.includes('@g.us')
            }
          });

          this.logger.log(`Created contact message record for operator ${operatorData.name} (${operatorData.id})`);
        }
      } catch (error) {
        this.logger.error(`Error creating contact message record: ${error.message}`);
        // Don't fail the entire operation if message record creation fails
      }
    }

    return result;
  }

  async sendReaction(data: SendReactionDto) {
    this.logger.log(`Sending reaction to message via instance ${data.instance}`);

    const { instance, ...messageData } = data;
    return await this.evolutionService.sendReaction(instance, messageData);
  }

  async sendSticker(data: SendStickerDto, operatorData?: OperatorData) {
    this.logger.log(`Sending sticker to ${data.number} via instance ${data.instance}`);

    const { instance, ...messageData } = data;
    const result = await this.evolutionService.sendSticker(instance, messageData);

    // Create message record if operator data is provided
    if (operatorData) {
      try {
        // Find queue for this customer
        const customerPhone = data.number.replace('@s.whatsapp.net', '').replace('@g.us', '');
        const queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);

        if (queue) {
          // Check if this is a group message and modify content accordingly
          let content = 'Sticker sent';
          if (data.number.includes('@g.us')) {
            content = `*${operatorData.name}:* ${content}`;
            this.logger.log(`Group sticker message detected, prepending operator name: ${operatorData.name}`);
          }

          await this.messagesService.createMessage({
            sessionId: queue.sessionId,
            evolutionMessageId: result.key.id,
            messageType: result.messageType,
            remoteJid: result.key.remoteJid,
            instance: data.instance,
            pushName: operatorData.name,
            source: 'chat',
            messageTimestamp: result.messageTimestamp,
            from: MessageFrom.OPERATOR,
            direction: MessageDirection.OUTBOUND,
            content: content,
            status: MessageStatus.PENDING,
            senderId: operatorData.id,
            senderName: operatorData.name,
            evolutionData: { data: result },
            metadata: {
              sticker: data.sticker,
              delay: data.delay,
              quoted: data.quoted,
              isGroupMessage: data.number.includes('@g.us')
            }
          });

          this.logger.log(`Created sticker message record for operator ${operatorData.name} (${operatorData.id})`);
        }
      } catch (error) {
        this.logger.error(`Error creating sticker message record: ${error.message}`);
        // Don't fail the entire operation if message record creation fails
      }
    }

    return result;
  }

  async sendStatus(data: SendStatusDto) {
    this.logger.log(`Sending status message via instance ${data.instance}`);

    const { instance, ...messageData } = data;
    return await this.evolutionService.sendStatus(instance, messageData);
  }

  async sendTemplate(data: SendTemplateDto, operatorData?: OperatorData) {
    this.logger.log(`Sending template message to ${data.number} via instance ${data.instance}`);

    const { instance, ...messageData } = data;
    const result = await this.evolutionService.sendTemplate(instance, messageData);

    // Create message record if operator data is provided
    if (operatorData) {
      try {
        // Find queue for this customer
        const customerPhone = data.number.replace('@s.whatsapp.net', '').replace('@g.us', '');
        const queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);

        if (queue) {
          // Check if this is a group message and modify content accordingly
          let content = `Template: ${data.name}`;
          if (data.number.includes('@g.us')) {
            content = `*${operatorData.name}:* ${content}`;
            this.logger.log(`Group template message detected, prepending operator name: ${operatorData.name}`);
          }

          await this.messagesService.createMessage({
            sessionId: queue.sessionId,
            evolutionMessageId: result.key.id,
            messageType: result.messageType,
            remoteJid: result.key.remoteJid,
            instance: data.instance,
            pushName: operatorData.name,
            source: 'chat',
            messageTimestamp: result.messageTimestamp,
            from: MessageFrom.OPERATOR,
            direction: MessageDirection.OUTBOUND,
            content: content,
            status: MessageStatus.PENDING,
            senderId: operatorData.id,
            senderName: operatorData.name,
            evolutionData: { data: result },
            metadata: {
              name: data.name,
              language: data.language,
              components: data.components,
              isGroupMessage: data.number.includes('@g.us')
            }
          });

          this.logger.log(`Created template message record for operator ${operatorData.name} (${operatorData.id})`);
        }
      } catch (error) {
        this.logger.error(`Error creating template message record: ${error.message}`);
        // Don't fail the entire operation if message record creation fails
      }
    }

    return result;
  }

  // Chat Management Methods
  async checkWhatsAppNumbers(data: CheckWhatsAppNumbersDto) {
    this.logger.log(`Checking WhatsApp numbers via instance ${data.instance}`);

    const { instance, ...checkData } = data;
    return await this.evolutionService.checkWhatsAppNumbers(instance, checkData);
  }

  async markMessagesAsRead(data: MarkMessagesAsReadDto) {
    this.logger.log(`Marking messages as read via instance ${data.instance}`);

    const { instance, ...readData } = data;
    return await this.evolutionService.markMessagesAsRead(instance, readData);
  }

  async archiveChat(data: ArchiveChatDto) {
    this.logger.log(`Archiving chat via instance ${data.instance}`);

    const { instance, ...archiveData } = data;
    return await this.evolutionService.archiveChat(instance, archiveData);
  }

  async markChatUnread(data: MarkChatUnreadDto) {
    this.logger.log(`Marking chat as unread via instance ${data.instance}`);

    const { instance, ...unreadData } = data;
    return await this.evolutionService.markChatUnread(instance, unreadData);
  }

  async deleteMessage(data: DeleteMessageDto) {
    this.logger.log(`Deleting message via instance ${data.instance}`);

    const { instance, ...deleteData } = data;
    return await this.evolutionService.deleteMessage(instance, deleteData);
  }

  async fetchProfilePicture(data: FetchProfilePictureDto) {
    this.logger.log(`Fetching profile picture for ${data.number} via instance ${data.instance}`);

    const { instance, ...fetchData } = data;
    return await this.evolutionService.fetchProfilePicture(instance, fetchData);
  }

  async getBase64FromMediaMessage(data: GetBase64FromMediaMessageDto) {
    this.logger.log(`Getting base64 from media message via instance ${data.instance}`);

    const { instance, ...mediaData } = data;
    return await this.evolutionService.getBase64FromMediaMessage(instance, mediaData);
  }

  async updateMessage(data: UpdateMessageDto) {
    this.logger.log(`Updating message via instance ${data.instance}`);

    const { instance, ...updateData } = data;
    return await this.evolutionService.updateMessage(instance, updateData);
  }

  async sendPresence(data: SendPresenceDto) {
    this.logger.log(`Sending presence to ${data.number} via instance ${data.instance}`);

    const { instance, ...presenceData } = data;
    return await this.evolutionService.sendPresence(instance, presenceData);
  }

  async updateBlockStatus(data: UpdateBlockStatusDto) {
    this.logger.log(`Updating block status for ${data.number} via instance ${data.instance}`);

    const { instance, ...blockData } = data;
    return await this.evolutionService.updateBlockStatus(instance, blockData);
  }

  async findContacts(data: FindContactsDto) {
    this.logger.log(`Finding contacts via instance ${data.instance}`);

    const { instance, ...findData } = data;
    return await this.evolutionService.findContacts(instance, findData);
  }

  async findMessages(data: FindMessagesDto) {
    this.logger.log(`Finding messages via instance ${data.instance}`);

    const { instance, ...findData } = data;
    return await this.evolutionService.findMessages(instance, findData);
  }

  async findStatusMessage(data: FindStatusMessageDto) {
    this.logger.log(`Finding status messages via instance ${data.instance}`);

    const { instance, ...findData } = data;
    return await this.evolutionService.findStatusMessage(instance, findData);
  }

  async findChats(data: FindChatsDto) {
    this.logger.log(`Finding chats via instance ${data.instance}`);

    const { instance } = data;
    return await this.evolutionService.findChats(instance);
  }

  // Profile Management Methods
  async fetchBusinessProfile(data: FetchBusinessProfileDto) {
    this.logger.log(`Fetching business profile for ${data.number} via instance ${data.instance}`);

    const { instance, number } = data;
    return await this.evolutionService.fetchBusinessProfile(instance, number);
  }

  async fetchProfile(data: FetchProfileDto) {
    this.logger.log(`Fetching profile for ${data.number} via instance ${data.instance}`);

    const { instance, number } = data;
    return await this.evolutionService.fetchProfile(instance, number);
  }

  async updateProfileName(data: UpdateProfileNameDto) {
    this.logger.log(`Updating profile name via instance ${data.instance}`);

    const { instance, ...nameData } = data;
    return await this.evolutionService.updateProfileName(instance, nameData);
  }

  async updateProfileStatus(data: UpdateProfileStatusDto) {
    this.logger.log(`Updating profile status via instance ${data.instance}`);

    const { instance, ...statusData } = data;
    return await this.evolutionService.updateProfileStatus(instance, statusData);
  }

  async updateProfilePicture(data: UpdateProfilePictureDto) {
    this.logger.log(`Updating profile picture via instance ${data.instance}`);

    const { instance, ...pictureData } = data;
    return await this.evolutionService.updateProfilePicture(instance, pictureData);
  }

  async removeProfilePicture(instance: string) {
    this.logger.log(`Removing profile picture via instance ${instance}`);
    return await this.evolutionService.removeProfilePicture(instance);
  }

  async fetchPrivacySettings(instance: string) {
    this.logger.log(`Fetching privacy settings via instance ${instance}`);
    return await this.evolutionService.fetchPrivacySettings(instance);
  }

  async updatePrivacySettings(data: UpdatePrivacySettingsDto) {
    this.logger.log(`Updating privacy settings via instance ${data.instance}`);

    const { instance, ...privacyData } = data;
    return await this.evolutionService.updatePrivacySettings(instance, privacyData);
  }

  // Label Management Methods
  async findLabels(data: FindLabelsDto) {
    this.logger.log(`Finding labels via instance ${data.instance}`);

    const { instance } = data;
    return await this.evolutionService.findLabels(instance);
  }

  async handleLabel(data: HandleLabelDto) {
    this.logger.log(`Handling label for ${data.number} via instance ${data.instance}`);

    const { instance, ...labelData } = data;
    return await this.evolutionService.handleLabel(instance, labelData);
  }

  // Call Management Methods
  async fakeCall(data: FakeCallDto) {
    this.logger.log(`Making fake call to ${data.number} via instance ${data.instance}`);

    const { instance, ...callData } = data;
    return await this.evolutionService.fakeCall(instance, callData);
  }

  // Media Methods
  async getMedia(data: GetMediaDto) {
    this.logger.log(`Getting media via instance ${data.instance}`);

    const { instance, ...mediaData } = data;
    return await this.evolutionService.getMedia(instance, mediaData);
  }

  async getMediaUrl(data: GetMediaUrlDto) {
    this.logger.log(`Getting media URL via instance ${data.instance}`);

    const { instance, ...urlData } = data;
    return await this.evolutionService.getMediaUrl(instance, urlData);
  }
}