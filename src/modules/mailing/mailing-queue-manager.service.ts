import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { MailingJobData } from './mailing-queue.processor';

@Injectable()
export class MailingQueueManagerService {
  private readonly logger = new Logger(MailingQueueManagerService.name);

  constructor(
    @InjectQueue('mailing') private readonly mailingQueue: Queue<MailingJobData>,
  ) {}

  async addMailingJob(mailingId: string, fileUrl: string, message: string): Promise<void> {
    try {
      const job = await this.mailingQueue.add(
        'process-mailing',
        {
          mailingId,
          fileUrl,
          message,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(`Added mailing job ${job.id} to queue for mailing ${mailingId}`);
    } catch (error) {
      this.logger.error(`Failed to add mailing job to queue: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        this.mailingQueue.getWaiting(),
        this.mailingQueue.getActive(),
        this.mailingQueue.getCompleted(),
        this.mailingQueue.getFailed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get queue status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async clearQueue(): Promise<void> {
    try {
      await this.mailingQueue.empty();
      this.logger.log('Mailing queue cleared successfully');
    } catch (error) {
      this.logger.error(`Failed to clear queue: ${error.message}`, error.stack);
      throw error;
    }
  }
}
