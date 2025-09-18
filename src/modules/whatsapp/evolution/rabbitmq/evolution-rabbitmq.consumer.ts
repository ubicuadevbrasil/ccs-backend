import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import type {
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
import { EvolutionMessageProcessorService } from './evolution-message-processor.service';

@Injectable()
export class EvolutionRabbitMQConsumer {
  private readonly logger = new Logger(EvolutionRabbitMQConsumer.name);

  constructor(
    private readonly messageProcessor: EvolutionMessageProcessorService,
  ) {}

  // Application Events
  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'APPLICATION_STARTUP',
    queue: 'evolution.application.startup',
    queueOptions: { durable: true },
  })
  async handleApplicationStartup(event: EvolutionApplicationStartupEvent): Promise<void> {
    try {
      this.logger.log(`Received APPLICATION_STARTUP event`);
      await this.messageProcessor.handleApplicationStartup(event);
    } catch (error) {
      this.logger.error('Error processing APPLICATION_STARTUP event:', error);
      throw error;
    }
  }

  // Instance Events
  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'INSTANCE_CREATE',
    queue: 'evolution.instance.create',
    queueOptions: { durable: true },
  })
  async handleInstanceCreate(event: EvolutionInstanceCreateEvent): Promise<void> {
    try {
      this.logger.log(`Received INSTANCE_CREATE event for instance: ${event.instance}`);
      await this.messageProcessor.handleInstanceCreate(event);
    } catch (error) {
      this.logger.error('Error processing INSTANCE_CREATE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'INSTANCE_DELETE',
    queue: 'evolution.instance.delete',
    queueOptions: { durable: true },
  })
  async handleInstanceDelete(event: EvolutionInstanceDeleteEvent): Promise<void> {
    try {
      this.logger.log(`Received INSTANCE_DELETE event for instance: ${event.instance}`);
      await this.messageProcessor.handleInstanceDelete(event);
    } catch (error) {
      this.logger.error('Error processing INSTANCE_DELETE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'QRCODE_UPDATED',
    queue: 'evolution.qrcode.updated',
    queueOptions: { durable: true },
  })
  async handleQrcodeUpdated(event: EvolutionQrcodeUpdatedEvent): Promise<void> {
    try {
      this.logger.log(`Received QRCODE_UPDATED event for instance: ${event.instance}`);
      await this.messageProcessor.handleQrcodeUpdated(event);
    } catch (error) {
      this.logger.error('Error processing QRCODE_UPDATED event:', error);
      throw error;
    }
  }

  // Message Events
  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'MESSAGES_SET',
    queue: 'evolution.messages.set',
    queueOptions: { durable: true },
  })
  async handleMessagesSet(event: EvolutionMessagesSetEvent): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_SET event for instance: ${event.instance}`);
      await this.messageProcessor.handleMessagesSet(event);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_SET event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'MESSAGES_UPSERT',
    queue: 'evolution.messages.upsert',
    queueOptions: { durable: true },
  })
  async handleMessagesUpsert(event: EvolutionMessagesUpsertEvent): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_UPSERT event for instance: ${event.instance}`);
      
      // Only process incoming messages (not outgoing)
      if (event.data.key.fromMe) {
        this.logger.debug('Skipping outgoing message');
        return;
      }

      // Only process conversation messages for now
      if (event.data.messageType !== 'conversation') {
        this.logger.debug(`Skipping non-conversation message type: ${event.data.messageType}`);
        return;
      }

      await this.messageProcessor.handleMessagesUpsert(event);
      this.logger.log(`Successfully processed message from ${event.data.key.remoteJid}`);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_UPSERT event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'MESSAGES_EDITED',
    queue: 'evolution.messages.edited',
    queueOptions: { durable: true },
  })
  async handleMessagesEdited(event: EvolutionMessagesEditedEvent): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_EDITED event for instance: ${event.instance}`);
      await this.messageProcessor.handleMessagesEdited(event);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_EDITED event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'MESSAGES_UPDATE',
    queue: 'evolution.messages.update',
    queueOptions: { durable: true },
  })
  async handleMessagesUpdate(event: EvolutionMessagesUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_UPDATE event for instance: ${event.instance}`);
      await this.messageProcessor.handleMessagesUpdate(event);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_UPDATE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'MESSAGES_DELETE',
    queue: 'evolution.messages.delete',
    queueOptions: { durable: true },
  })
  async handleMessagesDelete(event: EvolutionMessagesDeleteEvent): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_DELETE event for instance: ${event.instance}`);
      await this.messageProcessor.handleMessagesDelete(event);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_DELETE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'SEND_MESSAGE',
    queue: 'evolution.send.message',
    queueOptions: { durable: true },
  })
  async handleSendMessage(event: EvolutionSendMessageEvent): Promise<void> {
    try {
      this.logger.log(`Received SEND_MESSAGE event for instance: ${event.instance}`);
      await this.messageProcessor.handleSendMessage(event);
    } catch (error) {
      this.logger.error('Error processing SEND_MESSAGE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'SEND_MESSAGE_UPDATE',
    queue: 'evolution.send.message.update',
    queueOptions: { durable: true },
  })
  async handleSendMessageUpdate(event: EvolutionSendMessageUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received SEND_MESSAGE_UPDATE event for instance: ${event.instance}`);
      await this.messageProcessor.handleSendMessageUpdate(event);
    } catch (error) {
      this.logger.error('Error processing SEND_MESSAGE_UPDATE event:', error);
      throw error;
    }
  }

  // Contact Events
  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'CONTACTS_SET',
    queue: 'evolution.contacts.set',
    queueOptions: { durable: true },
  })
  async handleContactsSet(event: EvolutionContactsSetEvent): Promise<void> {
    try {
      this.logger.log(`Received CONTACTS_SET event for instance: ${event.instance}`);
      await this.messageProcessor.handleContactsSet(event);
    } catch (error) {
      this.logger.error('Error processing CONTACTS_SET event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'CONTACTS_UPSERT',
    queue: 'evolution.contacts.upsert',
    queueOptions: { durable: true },
  })
  async handleContactsUpsert(event: EvolutionContactsUpsertEvent): Promise<void> {
    try {
      this.logger.log(`Received CONTACTS_UPSERT event for instance: ${event.instance}`);
      await this.messageProcessor.handleContactsUpsert(event);
    } catch (error) {
      this.logger.error('Error processing CONTACTS_UPSERT event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'CONTACTS_UPDATE',
    queue: 'evolution.contacts.update',
    queueOptions: { durable: true },
  })
  async handleContactsUpdate(event: EvolutionContactsUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received CONTACTS_UPDATE event for instance: ${event.instance}`);
      await this.messageProcessor.handleContactsUpdate(event);
    } catch (error) {
      this.logger.error('Error processing CONTACTS_UPDATE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'PRESENCE_UPDATE',
    queue: 'evolution.presence.update',
    queueOptions: { durable: true },
  })
  async handlePresenceUpdate(event: EvolutionPresenceUpdateEvent): Promise<void> {
    try {
      this.logger.debug(`Received PRESENCE_UPDATE event for instance: ${event.instance}`);
      await this.messageProcessor.handlePresenceUpdate(event);
    } catch (error) {
      this.logger.error('Error processing PRESENCE_UPDATE event:', error);
      throw error;
    }
  }

  // Chat Events
  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'CHATS_SET',
    queue: 'evolution.chats.set',
    queueOptions: { durable: true },
  })
  async handleChatsSet(event: EvolutionChatsSetEvent): Promise<void> {
    try {
      this.logger.log(`Received CHATS_SET event for instance: ${event.instance}`);
      await this.messageProcessor.handleChatsSet(event);
    } catch (error) {
      this.logger.error('Error processing CHATS_SET event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'CHATS_UPSERT',
    queue: 'evolution.chats.upsert',
    queueOptions: { durable: true },
  })
  async handleChatsUpsert(event: EvolutionChatsUpsertEvent): Promise<void> {
    try {
      this.logger.log(`Received CHATS_UPSERT event for instance: ${event.instance}`);
      await this.messageProcessor.handleChatsUpsert(event);
    } catch (error) {
      this.logger.error('Error processing CHATS_UPSERT event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'CHATS_UPDATE',
    queue: 'evolution.chats.update',
    queueOptions: { durable: true },
  })
  async handleChatsUpdate(event: EvolutionChatsUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received CHATS_UPDATE event for instance: ${event.instance}`);
      await this.messageProcessor.handleChatsUpdate(event);
    } catch (error) {
      this.logger.error('Error processing CHATS_UPDATE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'CHATS_DELETE',
    queue: 'evolution.chats.delete',
    queueOptions: { durable: true },
  })
  async handleChatsDelete(event: EvolutionChatsDeleteEvent): Promise<void> {
    try {
      this.logger.log(`Received CHATS_DELETE event for instance: ${event.instance}`);
      await this.messageProcessor.handleChatsDelete(event);
    } catch (error) {
      this.logger.error('Error processing CHATS_DELETE event:', error);
      throw error;
    }
  }

  // Group Events
  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'GROUPS_UPSERT',
    queue: 'evolution.groups.upsert',
    queueOptions: { durable: true },
  })
  async handleGroupsUpsert(event: EvolutionGroupsUpsertEvent): Promise<void> {
    try {
      this.logger.log(`Received GROUPS_UPSERT event for instance: ${event.instance}`);
      await this.messageProcessor.handleGroupsUpsert(event);
    } catch (error) {
      this.logger.error('Error processing GROUPS_UPSERT event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'GROUP_UPDATE',
    queue: 'evolution.group.update',
    queueOptions: { durable: true },
  })
  async handleGroupUpdate(event: EvolutionGroupUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received GROUP_UPDATE event for instance: ${event.instance}`);
      await this.messageProcessor.handleGroupUpdate(event);
    } catch (error) {
      this.logger.error('Error processing GROUP_UPDATE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'GROUP_PARTICIPANTS_UPDATE',
    queue: 'evolution.group.participants.update',
    queueOptions: { durable: true },
  })
  async handleGroupParticipantsUpdate(event: EvolutionGroupParticipantsUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received GROUP_PARTICIPANTS_UPDATE event for instance: ${event.instance}`);
      await this.messageProcessor.handleGroupParticipantsUpdate(event);
    } catch (error) {
      this.logger.error('Error processing GROUP_PARTICIPANTS_UPDATE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'CONNECTION_UPDATE',
    queue: 'evolution.connection.update',
    queueOptions: { durable: true },
  })
  async handleConnectionUpdate(event: EvolutionConnectionUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Connection update for instance ${event.instance}: ${event.data.state}`);
      await this.messageProcessor.handleConnectionUpdate(event);
    } catch (error) {
      this.logger.error('Error processing CONNECTION_UPDATE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'REMOVE_INSTANCE',
    queue: 'evolution.remove.instance',
    queueOptions: { durable: true },
  })
  async handleRemoveInstance(event: EvolutionRemoveInstanceEvent): Promise<void> {
    try {
      this.logger.log(`Received REMOVE_INSTANCE event for instance: ${event.instance}`);
      await this.messageProcessor.handleRemoveInstance(event);
    } catch (error) {
      this.logger.error('Error processing REMOVE_INSTANCE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'LOGOUT_INSTANCE',
    queue: 'evolution.logout.instance',
    queueOptions: { durable: true },
  })
  async handleLogoutInstance(event: EvolutionLogoutInstanceEvent): Promise<void> {
    try {
      this.logger.log(`Received LOGOUT_INSTANCE event for instance: ${event.instance}`);
      await this.messageProcessor.handleLogoutInstance(event);
    } catch (error) {
      this.logger.error('Error processing LOGOUT_INSTANCE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'CALL',
    queue: 'evolution.call',
    queueOptions: { durable: true },
  })
  async handleCall(event: EvolutionCallEvent): Promise<void> {
    try {
      this.logger.log(`Received CALL event for instance: ${event.instance}`);
      await this.messageProcessor.handleCall(event);
    } catch (error) {
      this.logger.error('Error processing CALL event:', error);
      throw error;
    }
  }

  // Typebot Events
  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'TYPEBOT_START',
    queue: 'evolution.typebot.start',
    queueOptions: { durable: true },
  })
  async handleTypebotStart(event: EvolutionTypebotStartEvent): Promise<void> {
    try {
      this.logger.log(`Received TYPEBOT_START event for instance: ${event.instance}`);
      await this.messageProcessor.handleTypebotStart(event);
    } catch (error) {
      this.logger.error('Error processing TYPEBOT_START event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution.events',
    routingKey: 'TYPEBOT_CHANGE_STATUS',
    queue: 'evolution.typebot.change.status',
    queueOptions: { durable: true },
  })
  async handleTypebotChangeStatus(event: EvolutionTypebotChangeStatusEvent): Promise<void> {
    try {
      this.logger.log(`Received TYPEBOT_CHANGE_STATUS event for instance: ${event.instance}`);
      await this.messageProcessor.handleTypebotChangeStatus(event);
    } catch (error) {
      this.logger.error('Error processing TYPEBOT_CHANGE_STATUS event:', error);
      throw error;
    }
  }
}
