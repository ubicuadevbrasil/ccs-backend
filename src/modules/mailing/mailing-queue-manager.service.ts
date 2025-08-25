import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { MailingJobData } from './mailing-queue.processor';

@Injectable()
export class MailingQueueManagerService {
  private readonly logger = new Logger(MailingQueueManagerService.name);

  constructor(
    @InjectQueue('mailing') private readonly mailingQueue: Queue<MailingJobData>,
  ) {}

  async addMailingJob(mailingId: string, fileUrl: string, message: string): Promise<void> {
    try {
      this.logger.log(`Adding mailing job for mailing ${mailingId} to queue`);
      
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
          removeOnComplete: false,
          removeOnFail: false,
        },
      );

      this.logger.log(`Added mailing job ${job.id} to mailing queue for mailing ${mailingId}`);
      
      // Verify job was added by checking queue count
      const queueCount = await this.mailingQueue.count();
      this.logger.log(`Queue now contains ${queueCount} total jobs`);
      
      // Get all jobs to verify
      const allJobs = await this.mailingQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
      const mailingJobs = allJobs.filter(job => job.data.mailingId === mailingId);
      this.logger.log(`Found ${mailingJobs.length} jobs for mailing ${mailingId}`);
      
    } catch (error) {
      this.logger.error(`Failed to add mailing job to queue: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getQueueStatus(): Promise<{
    total: number;
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
        total: await this.mailingQueue.count(),
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

  async cleanupMailingQueue(mailingId: string): Promise<void> {
    try {
      // Get all jobs for this specific mailing
      const allJobs = await this.mailingQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
      const mailingJobs = allJobs.filter(job => job.data.mailingId === mailingId);
      
      // Remove completed and failed jobs for this mailing
      for (const job of mailingJobs) {
        const jobState = await job.getState();
        if (jobState === 'completed' || jobState === 'failed') {
          await job.remove();
        }
      }
      
      this.logger.log(`Cleaned up jobs for mailing ${mailingId}`);
    } catch (error) {
      this.logger.error(`Failed to cleanup jobs for mailing ${mailingId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getQueue(mailingId: string): Promise<Queue | undefined> {
    // Since we're using a single queue, return the main mailing queue
    return this.mailingQueue;
  }
}
