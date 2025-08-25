import { Injectable, Logger } from '@nestjs/common';
import { Processor, OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { MailingQueueService } from './mailing-queue.service';

export interface MailingJobData {
  mailingId: string;
  fileUrl: string;
  message: string;
}

@Injectable()
@Processor('mailing')
export class MailingQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(MailingQueueProcessor.name);

  constructor(private readonly mailingQueueService: MailingQueueService) {
    super();
  }

  async process(job: Job<MailingJobData>): Promise<void> {
    const { mailingId, fileUrl, message } = job.data;
    
    this.logger.log(`Processing mailing job ${job.id} for mailing ${mailingId}`);
    
    try {
      await this.mailingQueueService.processMailingFile(mailingId, fileUrl, message);
      
      this.logger.log(`Successfully completed mailing job ${job.id} for mailing ${mailingId}`);
    } catch (error) {
      this.logger.error(`Failed to process mailing job ${job.id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
