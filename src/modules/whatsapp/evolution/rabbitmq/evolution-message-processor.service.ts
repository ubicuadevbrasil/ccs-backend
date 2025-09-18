import { Injectable, Logger } from '@nestjs/common';
import {
  EvolutionApplicationStartupEvent,
  EvolutionInstanceCreateEvent,
  EvolutionInstanceDeleteEvent,
  EvolutionQrcodeUpdatedEvent,
  EvolutionMessagesSetEvent,
  EvolutionMessagesUpsertEvent,
  EvolutionMessagesEditedEvent,
  EvolutionMessagesUpdateEvent,
  EvolutionMessagesDeleteEvent,
  EvolutionSendMessageEvent,
  EvolutionSendMessageUpdateEvent,
  EvolutionContactsSetEvent,
  EvolutionContactsUpsertEvent,
  EvolutionContactsUpdateEvent,
  EvolutionPresenceUpdateEvent,
  EvolutionChatsSetEvent,
  EvolutionChatsUpsertEvent,
  EvolutionChatsUpdateEvent,
  EvolutionChatsDeleteEvent,
  EvolutionGroupsUpsertEvent,
  EvolutionGroupUpdateEvent,
  EvolutionGroupParticipantsUpdateEvent,
  EvolutionConnectionUpdateEvent,
  EvolutionRemoveInstanceEvent,
  EvolutionLogoutInstanceEvent,
  EvolutionCallEvent,
  EvolutionTypebotStartEvent,
  EvolutionTypebotChangeStatusEvent,
} from '../interfaces/evolution-rabbitmq.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EvolutionMessageProcessorService {
  private readonly logger = new Logger(EvolutionMessageProcessorService.name);
  private readonly logFilePath = path.join(process.cwd(), 'logs', 'evolution-events.jsonl');

  constructor() {
    // Ensure logs directory exists
    const logsDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  // Application Events
  async handleApplicationStartup(event: EvolutionApplicationStartupEvent): Promise<void> {
    try {
      this.logger.log(`Received APPLICATION_STARTUP event for instance: ${event.instance}`);
      this.logToFile('APPLICATION_STARTUP', event);
      this.logger.log(`Logged APPLICATION_STARTUP event to file`);
    } catch (error) {
      this.logger.error('Error processing APPLICATION_STARTUP event:', error);
      throw error;
    }
  }

  // Instance Events
  async handleInstanceCreate(event: EvolutionInstanceCreateEvent): Promise<void> {
    try {
      this.logger.log(`Received INSTANCE_CREATE event for instance: ${event.instance}`);
      this.logToFile('INSTANCE_CREATE', event);
      this.logger.log(`Logged INSTANCE_CREATE event to file`);
    } catch (error) {
      this.logger.error('Error processing INSTANCE_CREATE event:', error);
      throw error;
    }
  }

  async handleInstanceDelete(event: EvolutionInstanceDeleteEvent): Promise<void> {
    try {
      this.logger.log(`Received INSTANCE_DELETE event for instance: ${event.instance}`);
      this.logToFile('INSTANCE_DELETE', event);
      this.logger.log(`Logged INSTANCE_DELETE event to file`);
    } catch (error) {
      this.logger.error('Error processing INSTANCE_DELETE event:', error);
      throw error;
    }
  }

  async handleQrcodeUpdated(event: EvolutionQrcodeUpdatedEvent): Promise<void> {
    try {
      this.logger.log(`Received QRCODE_UPDATED event for instance: ${event.instance}`);
      this.logToFile('QRCODE_UPDATED', event);
      this.logger.log(`Logged QRCODE_UPDATED event to file`);
    } catch (error) {
      this.logger.error('Error processing QRCODE_UPDATED event:', error);
      throw error;
    }
  }

  // Message Events
  async handleMessagesSet(event: EvolutionMessagesSetEvent): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_SET event for instance: ${event.instance}`);
      this.logToFile('MESSAGES_SET', event);
      this.logger.log(`Logged MESSAGES_SET event to file`);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_SET event:', error);
      throw error;
    }
  }

  async handleMessagesUpsert(event: EvolutionMessagesUpsertEvent): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_UPSERT event for instance: ${event.instance}`);
      this.logToFile('MESSAGES_UPSERT', event);
      this.logger.log(`Logged MESSAGES_UPSERT event to file`);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_UPSERT event:', error);
      throw error;
    }
  }

  async handleMessagesEdited(event: EvolutionMessagesEditedEvent): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_EDITED event for instance: ${event.instance}`);
      this.logToFile('MESSAGES_EDITED', event);
      this.logger.log(`Logged MESSAGES_EDITED event to file`);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_EDITED event:', error);
      throw error;
    }
  }

  async handleMessagesUpdate(event: EvolutionMessagesUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_UPDATE event for instance: ${event.instance}`);
      this.logToFile('MESSAGES_UPDATE', event);
      this.logger.log(`Logged MESSAGES_UPDATE event to file`);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_UPDATE event:', error);
      throw error;
    }
  }

  async handleMessagesDelete(event: EvolutionMessagesDeleteEvent): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_DELETE event for instance: ${event.instance}`);
      this.logToFile('MESSAGES_DELETE', event);
      this.logger.log(`Logged MESSAGES_DELETE event to file`);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_DELETE event:', error);
      throw error;
    }
  }

  async handleSendMessage(event: EvolutionSendMessageEvent): Promise<void> {
    try {
      this.logger.log(`Received SEND_MESSAGE event for instance: ${event.instance}`);
      this.logToFile('SEND_MESSAGE', event);
      this.logger.log(`Logged SEND_MESSAGE event to file`);
    } catch (error) {
      this.logger.error('Error processing SEND_MESSAGE event:', error);
      throw error;
    }
  }

  async handleSendMessageUpdate(event: EvolutionSendMessageUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received SEND_MESSAGE_UPDATE event for instance: ${event.instance}`);
      this.logToFile('SEND_MESSAGE_UPDATE', event);
      this.logger.log(`Logged SEND_MESSAGE_UPDATE event to file`);
    } catch (error) {
      this.logger.error('Error processing SEND_MESSAGE_UPDATE event:', error);
      throw error;
    }
  }

  // Contact Events
  async handleContactsSet(event: EvolutionContactsSetEvent): Promise<void> {
    try {
      this.logger.log(`Received CONTACTS_SET event for instance: ${event.instance}`);
      this.logToFile('CONTACTS_SET', event);
      this.logger.log(`Logged CONTACTS_SET event to file`);
    } catch (error) {
      this.logger.error('Error processing CONTACTS_SET event:', error);
      throw error;
    }
  }

  async handleContactsUpsert(event: EvolutionContactsUpsertEvent): Promise<void> {
    try {
      this.logger.log(`Received CONTACTS_UPSERT event for instance: ${event.instance}`);
      this.logToFile('CONTACTS_UPSERT', event);
      this.logger.log(`Logged CONTACTS_UPSERT event to file`);
    } catch (error) {
      this.logger.error('Error processing CONTACTS_UPSERT event:', error);
      throw error;
    }
  }

  async handleContactsUpdate(event: EvolutionContactsUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received CONTACTS_UPDATE event for instance: ${event.instance}`);
      this.logToFile('CONTACTS_UPDATE', event);
      this.logger.log(`Logged CONTACTS_UPDATE event to file`);
    } catch (error) {
      this.logger.error('Error processing CONTACTS_UPDATE event:', error);
      throw error;
    }
  }

  async handlePresenceUpdate(event: EvolutionPresenceUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received PRESENCE_UPDATE event for instance: ${event.instance}`);
      this.logToFile('PRESENCE_UPDATE', event);
      this.logger.log(`Logged PRESENCE_UPDATE event to file`);
    } catch (error) {
      this.logger.error('Error processing PRESENCE_UPDATE event:', error);
      throw error;
    }
  }

  // Chat Events
  async handleChatsSet(event: EvolutionChatsSetEvent): Promise<void> {
    try {
      this.logger.log(`Received CHATS_SET event for instance: ${event.instance}`);
      this.logToFile('CHATS_SET', event);
      this.logger.log(`Logged CHATS_SET event to file`);
    } catch (error) {
      this.logger.error('Error processing CHATS_SET event:', error);
      throw error;
    }
  }

  async handleChatsUpsert(event: EvolutionChatsUpsertEvent): Promise<void> {
    try {
      this.logger.log(`Received CHATS_UPSERT event for instance: ${event.instance}`);
      this.logToFile('CHATS_UPSERT', event);
      this.logger.log(`Logged CHATS_UPSERT event to file`);
    } catch (error) {
      this.logger.error('Error processing CHATS_UPSERT event:', error);
      throw error;
    }
  }

  async handleChatsUpdate(event: EvolutionChatsUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received CHATS_UPDATE event for instance: ${event.instance}`);
      this.logToFile('CHATS_UPDATE', event);
      this.logger.log(`Logged CHATS_UPDATE event to file`);
    } catch (error) {
      this.logger.error('Error processing CHATS_UPDATE event:', error);
      throw error;
    }
  }

  async handleChatsDelete(event: EvolutionChatsDeleteEvent): Promise<void> {
    try {
      this.logger.log(`Received CHATS_DELETE event for instance: ${event.instance}`);
      this.logToFile('CHATS_DELETE', event);
      this.logger.log(`Logged CHATS_DELETE event to file`);
    } catch (error) {
      this.logger.error('Error processing CHATS_DELETE event:', error);
      throw error;
    }
  }

  // Group Events
  async handleGroupsUpsert(event: EvolutionGroupsUpsertEvent): Promise<void> {
    try {
      this.logger.log(`Received GROUPS_UPSERT event for instance: ${event.instance}`);
      this.logToFile('GROUPS_UPSERT', event);
      this.logger.log(`Logged GROUPS_UPSERT event to file`);
    } catch (error) {
      this.logger.error('Error processing GROUPS_UPSERT event:', error);
      throw error;
    }
  }

  async handleGroupUpdate(event: EvolutionGroupUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received GROUP_UPDATE event for instance: ${event.instance}`);
      this.logToFile('GROUP_UPDATE', event);
      this.logger.log(`Logged GROUP_UPDATE event to file`);
    } catch (error) {
      this.logger.error('Error processing GROUP_UPDATE event:', error);
      throw error;
    }
  }

  async handleGroupParticipantsUpdate(event: EvolutionGroupParticipantsUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received GROUP_PARTICIPANTS_UPDATE event for instance: ${event.instance}`);
      this.logToFile('GROUP_PARTICIPANTS_UPDATE', event);
      this.logger.log(`Logged GROUP_PARTICIPANTS_UPDATE event to file`);
    } catch (error) {
      this.logger.error('Error processing GROUP_PARTICIPANTS_UPDATE event:', error);
      throw error;
    }
  }

  async handleConnectionUpdate(event: EvolutionConnectionUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received CONNECTION_UPDATE event for instance: ${event.instance}`);
      this.logToFile('CONNECTION_UPDATE', event);
      this.logger.log(`Logged CONNECTION_UPDATE event to file`);
    } catch (error) {
      this.logger.error('Error processing CONNECTION_UPDATE event:', error);
      throw error;
    }
  }

  async handleRemoveInstance(event: EvolutionRemoveInstanceEvent): Promise<void> {
    try {
      this.logger.log(`Received REMOVE_INSTANCE event for instance: ${event.instance}`);
      this.logToFile('REMOVE_INSTANCE', event);
      this.logger.log(`Logged REMOVE_INSTANCE event to file`);
    } catch (error) {
      this.logger.error('Error processing REMOVE_INSTANCE event:', error);
      throw error;
    }
  }

  async handleLogoutInstance(event: EvolutionLogoutInstanceEvent): Promise<void> {
    try {
      this.logger.log(`Received LOGOUT_INSTANCE event for instance: ${event.instance}`);
      this.logToFile('LOGOUT_INSTANCE', event);
      this.logger.log(`Logged LOGOUT_INSTANCE event to file`);
    } catch (error) {
      this.logger.error('Error processing LOGOUT_INSTANCE event:', error);
      throw error;
    }
  }

  async handleCall(event: EvolutionCallEvent): Promise<void> {
    try {
      this.logger.log(`Received CALL event for instance: ${event.instance}`);
      this.logToFile('CALL', event);
      this.logger.log(`Logged CALL event to file`);
    } catch (error) {
      this.logger.error('Error processing CALL event:', error);
      throw error;
    }
  }

  // Typebot Events
  async handleTypebotStart(event: EvolutionTypebotStartEvent): Promise<void> {
    try {
      this.logger.log(`Received TYPEBOT_START event for instance: ${event.instance}`);
      this.logToFile('TYPEBOT_START', event);
      this.logger.log(`Logged TYPEBOT_START event to file`);
    } catch (error) {
      this.logger.error('Error processing TYPEBOT_START event:', error);
      throw error;
    }
  }

  async handleTypebotChangeStatus(event: EvolutionTypebotChangeStatusEvent): Promise<void> {
    try {
      this.logger.log(`Received TYPEBOT_CHANGE_STATUS event for instance: ${event.instance}`);
      this.logToFile('TYPEBOT_CHANGE_STATUS', event);
      this.logger.log(`Logged TYPEBOT_CHANGE_STATUS event to file`);
    } catch (error) {
      this.logger.error('Error processing TYPEBOT_CHANGE_STATUS event:', error);
      throw error;
    }
  }

  /**
   * Log event to file in JSONL format (one JSON object per line)
   */
  private logToFile(eventType: string, event: any): void {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        eventType,
        event,
      };
      
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(this.logFilePath, logLine, 'utf8');
      
      this.logger.debug(`Event logged to ${this.logFilePath}`);
    } catch (error) {
      this.logger.error('Error writing to log file:', error);
    }
  }
}
