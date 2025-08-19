import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GroupService } from '../group/group.service';
import { EvolutionService } from '../evolution/evolution.service';

@Injectable()
export class StartupService implements OnModuleInit {
  private readonly logger = new Logger(StartupService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly groupService: GroupService,
    private readonly evolutionService: EvolutionService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting server initialization...');
    
    try {
      await this.syncGroupsOnStartup();
      this.logger.log('Server initialization completed successfully');
    } catch (error) {
      this.logger.error('Failed to complete server initialization:', error);
      // Don't throw error to allow server to start even if sync fails
    }
  }

  /**
   * Fetch instances from Evolution API
   */
  private async fetchInstanceFromEvolution(): Promise<string | null> {
    try {
      this.logger.log('No instance configured, attempting to fetch from Evolution API...');
      
      // Try to fetch instances from Evolution API
      const instances = await this.evolutionService.fetchInstances();
      
      if (instances && Array.isArray(instances) && instances.length > 0) {
        // Use the first available instance
        const instanceName = instances[0].instanceName;
        this.logger.log(`Found instance from Evolution API: ${instanceName}`);
        return instanceName;
      }
      
      this.logger.warn('No instances found in Evolution API');
      return null;
    } catch (error) {
      this.logger.error('Failed to fetch instances from Evolution API:', error);
      return null;
    }
  }

  /**
   * Sync groups from Evolution API to database on startup
   */
  private async syncGroupsOnStartup(): Promise<void> {
    this.logger.log('Starting group sync on server startup...');

    try {
      // Get instance from environment or config
      let instance = this.getInstanceFromConfig();
      
      // If no instance configured, try to fetch from Evolution API
      if (!instance) {
        this.logger.warn('No instance configured in environment variables');
        instance = await this.fetchInstanceFromEvolution();
      }
      
      if (!instance) {
        this.logger.warn('No instance available for group sync');
        return;
      }

      this.logger.log(`Found instance to sync: ${instance}`);

      try {
        this.logger.log(`Syncing groups for instance: ${instance}`);
        
        // Check if instance is connected
        const connectionState = await this.evolutionService.getConnectionState(instance);
        
        if (connectionState?.instance?.state !== 'open') {
          this.logger.warn(`Instance ${instance} is not connected (state: ${connectionState?.instance?.state}), skipping group sync`);
          return;
        }

        // Sync groups from Evolution API to database
        const result = await this.groupService.syncGroupsFromEvolution(instance);
        this.logger.log(`Successfully synced groups for instance ${instance}: ${result.syncedGroups} groups`);

      } catch (error) {
        this.logger.error(`Error syncing groups for instance ${instance}:`, error);
      }

      this.logger.log('Group sync on startup completed');

    } catch (error) {
      this.logger.error('Error during group sync on startup:', error);
      throw error;
    }
  }

  /**
   * Get instances from configuration
   */
  private getInstanceFromConfig(): string | null {
    // Try to get instances from environment variables
    const instanceEnv = this.configService.get<string>('EVOLUTION_API_INSTANCE');
    
    if (instanceEnv) {
      return instanceEnv;
    }

    // Fallback to default instance if configured
    const defaultInstance = this.configService.get<string>('EVOLUTION_DEFAULT_INSTANCE');
    if (defaultInstance) {
      return defaultInstance;
    }

    // If no instances configured, return null
    // The sync method will handle this case
    return null;
  }

  /**
   * Manual sync groups method that can be called via API
   */
  async syncGroups(instance?: string): Promise<any> {
    this.logger.log(`Manual group sync requested${instance ? ` for instance: ${instance}` : ''}`);

    try {
      if (instance) {
        // Sync specific instance
        const result = await this.groupService.syncGroupsFromEvolution(instance);
        return {
          success: true,
          instance,
          result,
        };
      } else {
        // Sync configured instance
        const configuredInstance = this.getInstanceFromConfig();
        
        if (!configuredInstance) {
          return {
            success: false,
            error: 'No instance configured',
          };
        }

        try {
          const result = await this.groupService.syncGroupsFromEvolution(configuredInstance);
          return {
            success: true,
            instance: configuredInstance,
            result,
          };
        } catch (error) {
          return {
            success: false,
            instance: configuredInstance,
            error: error.message,
          };
        }
      }
    } catch (error) {
      this.logger.error('Error in manual group sync:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get startup status
   */
  async getStartupStatus(): Promise<any> {
    const instance = this.getInstanceFromConfig();
    
    const status = {
      startupCompleted: true,
      instanceConfigured: !!instance,
      instance: instance || null,
      timestamp: new Date().toISOString(),
    };

    return status;
  }
} 