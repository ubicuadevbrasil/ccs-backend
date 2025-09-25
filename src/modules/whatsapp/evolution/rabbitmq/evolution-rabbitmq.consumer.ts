import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe, RabbitPayload } from '@golevelup/nestjs-rabbitmq';
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

/**
 * Evolution RabbitMQ Consumer using @golevelup/nestjs-rabbitmq
 * This is a cleaner implementation using decorators instead of manual subscription setup
 */
@Injectable()
export class EvolutionRabbitMQConsumer {
  private readonly logger = new Logger(EvolutionRabbitMQConsumer.name);

  constructor(
    private readonly messageProcessor: EvolutionMessageProcessorService,
  ) { }

  // =============================================================================
  // APPLICATION EVENTS
  // =============================================================================

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'application.startup',
    queue: 'evolution.application.startup',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleApplicationStartup(
    @RabbitPayload() event: EvolutionApplicationStartupEvent,
  ): Promise<void> {
    try {
      this.logger.log('Received APPLICATION_STARTUP event');
      await this.messageProcessor.handleApplicationStartup(event);
    } catch (error) {
      this.logger.error('Error processing APPLICATION_STARTUP event:', error);
      throw error;
    }
  }

  // =============================================================================
  // INSTANCE EVENTS
  // =============================================================================

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'instance.create',
    queue: 'evolution.instance.create',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleInstanceCreate(
    @RabbitPayload() event: EvolutionInstanceCreateEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received INSTANCE_CREATE event for instance: ${event.instance}`);
      await this.messageProcessor.handleInstanceCreate(event);
    } catch (error) {
      this.logger.error('Error processing INSTANCE_CREATE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'instance.delete',
    queue: 'evolution.instance.delete',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleInstanceDelete(
    @RabbitPayload() event: EvolutionInstanceDeleteEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received INSTANCE_DELETE event for instance: ${event.instance}`);
      await this.messageProcessor.handleInstanceDelete(event);
    } catch (error) {
      this.logger.error('Error processing INSTANCE_DELETE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'qrcode.updated',
    queue: 'evolution.qrcode.updated',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleQrcodeUpdated(
    @RabbitPayload() event: EvolutionQrcodeUpdatedEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received QRCODE_UPDATED event for instance: ${event.instance}`);
      await this.messageProcessor.handleQrcodeUpdated(event);
    } catch (error) {
      this.logger.error('Error processing QRCODE_UPDATED event:', error);
      throw error;
    }
  }

  // =============================================================================
  // MESSAGE EVENTS
  // =============================================================================

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'messages.set',
    queue: 'evolution.messages.set',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleMessagesSet(
    @RabbitPayload() event: EvolutionMessagesSetEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_SET event for instance: ${event.instance}`);
      await this.messageProcessor.handleMessagesSet(event);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_SET event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'messages.upsert',
    queue: 'evolution.messages.upsert',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleMessagesUpsert(
    @RabbitPayload() event: EvolutionMessagesUpsertEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_UPSERT event for instance: ${event.instance}`);
      await this.messageProcessor.handleMessagesUpsert(event);
      this.logger.log(`Successfully processed message from ${event.data.key.remoteJid}`);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_UPSERT event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'messages.edited',
    queue: 'evolution.messages.edited',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleMessagesEdited(
    @RabbitPayload() event: EvolutionMessagesEditedEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_EDITED event for instance: ${event.instance}`);
      await this.messageProcessor.handleMessagesEdited(event);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_EDITED event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'messages.update',
    queue: 'evolution.messages.update',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleMessagesUpdate(
    @RabbitPayload() event: EvolutionMessagesUpdateEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_UPDATE event for instance: ${event.instance}`);
      await this.messageProcessor.handleMessagesUpdate(event);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_UPDATE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'messages.delete',
    queue: 'evolution.messages.delete',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleMessagesDelete(
    @RabbitPayload() event: EvolutionMessagesDeleteEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_DELETE event for instance: ${event.instance}`);
      await this.messageProcessor.handleMessagesDelete(event);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_DELETE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'send.message',
    queue: 'evolution.send.message',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleSendMessage(
    @RabbitPayload() event: EvolutionSendMessageEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received SEND_MESSAGE event for instance: ${event.instance}`);
      await this.messageProcessor.handleSendMessage(event);
    } catch (error) {
      this.logger.error('Error processing SEND_MESSAGE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'send.message.update',
    queue: 'evolution.send.message.update',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleSendMessageUpdate(
    @RabbitPayload() event: EvolutionSendMessageUpdateEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received SEND_MESSAGE_UPDATE event for instance: ${event.instance}`);
      await this.messageProcessor.handleSendMessageUpdate(event);
    } catch (error) {
      this.logger.error('Error processing SEND_MESSAGE_UPDATE event:', error);
      throw error;
    }
  }

  // =============================================================================
  // CONTACT EVENTS
  // =============================================================================

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'contacts.set',
    queue: 'evolution.contacts.set',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleContactsSet(
    @RabbitPayload() event: EvolutionContactsSetEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received CONTACTS_SET event for instance: ${event.instance}`);
      await this.messageProcessor.handleContactsSet(event);
    } catch (error) {
      this.logger.error('Error processing CONTACTS_SET event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'contacts.upsert',
    queue: 'evolution.contacts.upsert',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleContactsUpsert(
    @RabbitPayload() event: EvolutionContactsUpsertEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received CONTACTS_UPSERT event for instance: ${event.instance}`);
      await this.messageProcessor.handleContactsUpsert(event);
    } catch (error) {
      this.logger.error('Error processing CONTACTS_UPSERT event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'contacts.update',
    queue: 'evolution.contacts.update',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleContactsUpdate(
    @RabbitPayload() event: EvolutionContactsUpdateEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received CONTACTS_UPDATE event for instance: ${event.instance}`);
      await this.messageProcessor.handleContactsUpdate(event);
    } catch (error) {
      this.logger.error('Error processing CONTACTS_UPDATE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'presence.update',
    queue: 'evolution.presence.update',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handlePresenceUpdate(
    @RabbitPayload() event: EvolutionPresenceUpdateEvent,
  ): Promise<void> {
    try {
      this.logger.debug(`Received PRESENCE_UPDATE event for instance: ${event.instance}`);
      await this.messageProcessor.handlePresenceUpdate(event);
    } catch (error) {
      this.logger.error('Error processing PRESENCE_UPDATE event:', error);
      throw error;
    }
  }

  // =============================================================================
  // CHAT EVENTS
  // =============================================================================

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'chats.set',
    queue: 'evolution.chats.set',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleChatsSet(
    @RabbitPayload() event: EvolutionChatsSetEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received CHATS_SET event for instance: ${event.instance}`);
      await this.messageProcessor.handleChatsSet(event);
    } catch (error) {
      this.logger.error('Error processing CHATS_SET event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'chats.upsert',
    queue: 'evolution.chats.upsert',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleChatsUpsert(
    @RabbitPayload() event: EvolutionChatsUpsertEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received CHATS_UPSERT event for instance: ${event.instance}`);
      await this.messageProcessor.handleChatsUpsert(event);
    } catch (error) {
      this.logger.error('Error processing CHATS_UPSERT event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'chats.update',
    queue: 'evolution.chats.update',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleChatsUpdate(
    @RabbitPayload() event: EvolutionChatsUpdateEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received CHATS_UPDATE event for instance: ${event.instance}`);
      await this.messageProcessor.handleChatsUpdate(event);
    } catch (error) {
      this.logger.error('Error processing CHATS_UPDATE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'chats.delete',
    queue: 'evolution.chats.delete',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleChatsDelete(
    @RabbitPayload() event: EvolutionChatsDeleteEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received CHATS_DELETE event for instance: ${event.instance}`);
      await this.messageProcessor.handleChatsDelete(event);
    } catch (error) {
      this.logger.error('Error processing CHATS_DELETE event:', error);
      throw error;
    }
  }

  // =============================================================================
  // GROUP EVENTS
  // =============================================================================

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'groups.upsert',
    queue: 'evolution.groups.upsert',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleGroupsUpsert(
    @RabbitPayload() event: EvolutionGroupsUpsertEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received GROUPS_UPSERT event for instance: ${event.instance}`);
      await this.messageProcessor.handleGroupsUpsert(event);
    } catch (error) {
      this.logger.error('Error processing GROUPS_UPSERT event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'group.update',
    queue: 'evolution.group.update',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleGroupUpdate(
    @RabbitPayload() event: EvolutionGroupUpdateEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received GROUP_UPDATE event for instance: ${event.instance}`);
      await this.messageProcessor.handleGroupUpdate(event);
    } catch (error) {
      this.logger.error('Error processing GROUP_UPDATE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'group.participants.update',
    queue: 'evolution.group.participants.update',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleGroupParticipantsUpdate(
    @RabbitPayload() event: EvolutionGroupParticipantsUpdateEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received GROUP_PARTICIPANTS_UPDATE event for instance: ${event.instance}`);
      await this.messageProcessor.handleGroupParticipantsUpdate(event);
    } catch (error) {
      this.logger.error('Error processing GROUP_PARTICIPANTS_UPDATE event:', error);
      throw error;
    }
  }

  // =============================================================================
  // CONNECTION AND INSTANCE MANAGEMENT EVENTS
  // =============================================================================

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'connection.update',
    queue: 'evolution.connection.update',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleConnectionUpdate(
    @RabbitPayload() event: EvolutionConnectionUpdateEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Connection update for instance ${event.instance}: ${event.data.state}`);
      await this.messageProcessor.handleConnectionUpdate(event);
    } catch (error) {
      this.logger.error('Error processing CONNECTION_UPDATE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'remove.instance',
    queue: 'evolution.remove.instance',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleRemoveInstance(
    @RabbitPayload() event: EvolutionRemoveInstanceEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received REMOVE_INSTANCE event for instance: ${event.instance}`);
      await this.messageProcessor.handleRemoveInstance(event);
    } catch (error) {
      this.logger.error('Error processing REMOVE_INSTANCE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'logout.instance',
    queue: 'evolution.logout.instance',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleLogoutInstance(
    @RabbitPayload() event: EvolutionLogoutInstanceEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received LOGOUT_INSTANCE event for instance: ${event.instance}`);
      await this.messageProcessor.handleLogoutInstance(event);
    } catch (error) {
      this.logger.error('Error processing LOGOUT_INSTANCE event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'call',
    queue: 'evolution.call',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleCall(
    @RabbitPayload() event: EvolutionCallEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received CALL event for instance: ${event.instance}`);
      await this.messageProcessor.handleCall(event);
    } catch (error) {
      this.logger.error('Error processing CALL event:', error);
      throw error;
    }
  }

  // =============================================================================
  // TYPEBOT EVENTS
  // =============================================================================

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'typebot.start',
    queue: 'evolution.typebot.start',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleTypebotStart(
    @RabbitPayload() event: EvolutionTypebotStartEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received TYPEBOT_START event for instance: ${event.instance}`);
      await this.messageProcessor.handleTypebotStart(event);
    } catch (error) {
      this.logger.error('Error processing TYPEBOT_START event:', error);
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'evolution_exchange',
    routingKey: 'typebot.change.status',
    queue: 'evolution.typebot.change.status',
    queueOptions: {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum'
      }
    }
  })
  async handleTypebotChangeStatus(
    @RabbitPayload() event: EvolutionTypebotChangeStatusEvent,
  ): Promise<void> {
    try {
      this.logger.log(`Received TYPEBOT_CHANGE_STATUS event for instance: ${event.instance}`);
      await this.messageProcessor.handleTypebotChangeStatus(event);
    } catch (error) {
      this.logger.error('Error processing TYPEBOT_CHANGE_STATUS event:', error);
      throw error;
    }
  }
}
