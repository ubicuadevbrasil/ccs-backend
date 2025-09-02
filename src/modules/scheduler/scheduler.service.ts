import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { EvolutionService } from '../evolution/evolution.service';
import { QueuesService } from '../queues/queues.service';
import { MessagesService } from '../messages/messages.service';
import { TypebotService } from '../typebot/typebot.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly evolutionService: EvolutionService,
    private readonly queuesService: QueuesService,
    private readonly messagesService: MessagesService,
    private readonly typebotService: TypebotService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleInactiveTypebotSessions() {
    this.logger.log('Starting inactive typebot sessions cleanup...');
    
    try {
      // Get configured evolution instances
      const instances = this.getConfiguredInstances();
      
      if (instances.length === 0) {
        this.logger.warn('No evolution instances configured for cleanup');
        return;
      }
      
      for (const instance of instances) {
        await this.cleanupInactiveSessionsForInstance(instance);
      }
      
      this.logger.log('Inactive typebot sessions cleanup completed');
    } catch (error) {
      this.logger.error('Error during inactive sessions cleanup:', error);
    }
  }

  private getConfiguredInstances(): string[] {
    // Get instances from environment variables
    const instanceEnv = this.configService.get<string>('EVOLUTION_API_INSTANCE');
    const defaultInstance = this.configService.get<string>('EVOLUTION_DEFAULT_INSTANCE');
    
    const instances: string[] = [];
    
    if (instanceEnv) {
      instances.push(instanceEnv);
    }
    
    if (defaultInstance && !instances.includes(defaultInstance)) {
      instances.push(defaultInstance);
    }
    
    // If no instances configured, use 'default' as fallback
    if (instances.length === 0) {
      instances.push('default');
      this.logger.warn('No evolution instances configured, using fallback "default"');
    }
    
    return instances;
  }

  private async cleanupInactiveSessionsForInstance(instance: string) {
    try {
      // Find all typebots for this instance
      const typebots = await this.evolutionService.findTypebots(instance);
      
      if (!typebots || typebots.length === 0) {
        this.logger.debug(`No typebots found for instance ${instance}`);
        return;
      }

      for (const typebot of typebots) {
        await this.cleanupInactiveSessionsForTypebot(instance, typebot.id);
      }
    } catch (error) {
      this.logger.error(`Error cleaning up sessions for instance ${instance}:`, error);
    }
  }

  private async cleanupInactiveSessionsForTypebot(instance: string, typebotId: string) {
    try {
      // Fetch all sessions for this typebot
      const sessions = await this.evolutionService.fetchSessions(instance, typebotId);
      
      if (!sessions || sessions.length === 0) {
        return;
      }

      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      for (const session of sessions) {
        // Skip group messages (@g.us)
        if (session.remoteJid && session.remoteJid.includes('@g.us')) {
          this.logger.debug(`Skipping group session ${session.sessionId} for ${session.remoteJid}`);
          continue;
        }

        // Check if session is opened and has been inactive for more than 5 minutes
        if (session.status === 'opened' && session.updatedAt) {
          const sessionUpdatedAt = new Date(session.updatedAt);
          
          if (sessionUpdatedAt < fiveMinutesAgo) {
            await this.handleInactiveSession(instance, session, typebotId);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error cleaning up sessions for typebot ${typebotId}:`, error);
    }
  }

  private async handleInactiveSession(instance: string, session: any, typebotId: string) {
    try {
      const remoteJid = session.remoteJid;
      if (!remoteJid) {
        this.logger.warn(`Session ${session.sessionId} has no remoteJid`);
        return;
      }

      // Skip group messages
      if (remoteJid.includes('@g.us')) {
        this.logger.debug(`Skipping group session ${session.sessionId} for ${remoteJid}`);
        return;
      }

      this.logger.log(`Handling inactive session ${session.sessionId} for ${remoteJid}`);

      // Find the corresponding queue
      const customerPhone = remoteJid.replace('@s.whatsapp.net', '');
      const queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);

      if (!queue) {
        this.logger.warn(`No queue found for customer ${customerPhone}`);
        return;
      }

      // Send inactivity message
      await this.sendInactivityMessage(instance, remoteJid);

      // Update queue status to cancelled
      await this.queuesService.updateQueue(queue.id, {
        status: 'cancelled' as any,
        metadata: {
          ...queue.metadata,
          cancelledAt: new Date().toISOString(),
          cancellationReason: 'inactivity',
          lastActivity: session.updatedAt,
        }
      });

      // Close the typebot session
      await this.evolutionService.changeSessionStatus(instance, {
        remoteJid,
        status: 'closed'
      });

      this.logger.log(`Successfully closed inactive session ${session.sessionId} for ${remoteJid}`);
    } catch (error) {
      this.logger.error(`Error handling inactive session ${session.sessionId}:`, error);
    }
  }

  private async sendInactivityMessage(instance: string, remoteJid: string) {
    try {
      // Extract phone number from remoteJid (remove @s.whatsapp.net if present)
      const phoneNumber = remoteJid.replace('@s.whatsapp.net', '');
      
      // Send the inactivity message using Evolution API
      await this.evolutionService.sendText(instance, {
        number: phoneNumber,
        text: 'Atendimento encerrado por inatividade'
      });
      
      this.logger.log(`Sent inactivity message to ${phoneNumber} via instance ${instance}`);
    } catch (error) {
      this.logger.error(`Error sending inactivity message to ${remoteJid}:`, error);
    }
  }

  private async closeCustomerTypebotSessions(instance: string, remoteJid: string): Promise<void> {
    try {
      if (!instance) {
        this.logger.warn(`No evolution instance available to close sessions for ${remoteJid}`);
        return;
      }

      // Find all typebots for this instance
      const typebots = await this.evolutionService.findTypebots(instance);

      if (!typebots || typebots.length === 0) {
        this.logger.debug(`No typebots found for instance ${instance}`);
        return;
      }

      let sessionsClosed = 0;

      // Check each typebot for sessions with this customer
      for (const typebot of typebots) {
        try {
          const sessions = await this.evolutionService.fetchSessions(instance, typebot.id);

          if (sessions && sessions.length > 0) {
            // Find sessions for this specific customer
            // Handle both formats: with and without @s.whatsapp.net
            const customerPhone = remoteJid.replace('@s.whatsapp.net', '');
            const customerSessions = sessions.filter(session =>
              (session.remoteJid === remoteJid || 
               session.remoteJid === customerPhone ||
               session.remoteJid === `${customerPhone}@s.whatsapp.net`) &&
              ['opened', 'paused'].includes(session.status)
            );

                          // Close any active/paused sessions for this customer
              for (const session of customerSessions) {
                try {
                  // Use the exact remoteJid from the session for closing
                  await this.evolutionService.changeSessionStatus(instance, {
                    remoteJid: session.remoteJid,
                    status: 'closed'
                  });

                  sessionsClosed++;
                  this.logger.log(`Closed typebot session ${session.sessionId} for ${session.remoteJid} in typebot ${typebot.id}`);
                } catch (sessionError) {
                  this.logger.error(`Error closing session ${session.sessionId} for ${session.remoteJid}:`, sessionError);
                }
              }
          }
        } catch (typebotError) {
          this.logger.error(`Error checking sessions for typebot ${typebot.id}:`, typebotError);
        }
      }

      if (sessionsClosed > 0) {
        this.logger.log(`Successfully closed ${sessionsClosed} typebot sessions for ${remoteJid}`);
      } else {
        this.logger.debug(`No active or paused typebot sessions found for ${remoteJid}`);
      }
    } catch (error) {
      this.logger.error(`Error closing typebot sessions for ${remoteJid}:`, error);
    }
  }

  // New method to handle queues without active typebot sessions
  @Cron(CronExpression.EVERY_MINUTE)
  async handleInactiveQueuesWithoutSessions() {
    this.logger.log('Starting inactive queues cleanup (no typebot sessions)...');
    
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Find queues that are in typebot status but have no active typebot session
      // and have been created more than 5 minutes ago
      const inactiveQueues = await this.queuesService.findInactiveQueuesWithoutSessions(fiveMinutesAgo);
      
      for (const queue of inactiveQueues) {
        await this.handleInactiveQueueWithoutSession(queue);
      }
      
      this.logger.log(`Processed ${inactiveQueues.length} inactive queues without sessions`);
    } catch (error) {
      this.logger.error('Error during inactive queues cleanup:', error);
    }
  }

  // New method to handle waiting queue timeouts
  @Cron(CronExpression.EVERY_MINUTE)
  async handleWaitingQueueTimeouts() {
    this.logger.log('Starting waiting queue timeout cleanup...');
    
    try {
      await this.typebotService.handleWaitingQueueTimeout();
      this.logger.log('Waiting queue timeout cleanup completed');
    } catch (error) {
      this.logger.error('Error during waiting queue timeout cleanup:', error);
    }
  }

  private async handleInactiveQueueWithoutSession(queue: any) {
    try {
      // Skip if no customer ID
      if (!queue.customerId) {
        this.logger.warn(`Queue ${queue.id} has no customerId`);
        return;
      }

      // Get customer information to get the proper remoteJid
      const customer = await this.queuesService.findQueueWithCustomer(queue.id);
      
      if (!customer || !customer.customer?.remoteJid) {
        this.logger.warn(`No customer or remoteJid found for queue ${queue.id}`);
        return;
      }

      const remoteJid = customer.customer.remoteJid;

      this.logger.log(`Handling inactive queue ${queue.id} for ${remoteJid} (created: ${queue.createdAt})`);

      // Close any existing typebot sessions for this customer if we have an evolution instance
      if (queue.evolutionInstance) {
        this.logger.log(`Attempting to close typebot sessions for ${remoteJid} on instance ${queue.evolutionInstance}`);
        await this.closeCustomerTypebotSessions(queue.evolutionInstance, remoteJid);
      } else {
        this.logger.warn(`No evolution instance found for queue ${queue.id}`);
      }

      // Update queue status to cancelled
      await this.queuesService.updateQueue(queue.id, {
        status: 'cancelled' as any,
        metadata: {
          ...queue.metadata,
          cancelledAt: new Date().toISOString(),
          cancellationReason: 'inactivity_no_session',
          lastActivity: queue.createdAt,
        }
      });

      // Send inactivity message if we have an evolution instance
      if (queue.evolutionInstance) {
        this.logger.log(`Sending inactivity message to ${remoteJid} via instance ${queue.evolutionInstance}`);
        await this.sendInactivityMessage(queue.evolutionInstance, remoteJid);
      }

      this.logger.log(`Successfully cancelled inactive queue ${queue.id} for ${remoteJid}`);
    } catch (error) {
      this.logger.error(`Error handling inactive queue ${queue.id}:`, error);
    }
  }
}
