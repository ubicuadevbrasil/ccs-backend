import { Injectable, Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailingQueueService } from './mailing-queue.service';

export interface MailingJobData {
  mailingId: string;
  fileUrl: string;
  message: string;
}

@Injectable()
@Processor('mailing')
export class MailingQueueProcessor {
  private readonly logger = new Logger(MailingQueueProcessor.name);

  constructor(private readonly mailingQueueService: MailingQueueService) {}

  @Process('process-mailing')
  async process(job: Job<MailingJobData>): Promise<void> {
    const { mailingId, fileUrl, message } = job.data;
    
    this.logger.log(`Processing mailing job ${job.id} for mailing ${mailingId}`);
    
    try {
      await this.mailingQueueService.processMailingFile(mailingId, fileUrl, message);
      
      this.logger.log(`Successfully completed mailing job ${job.id} for mailing ${mailingId}`);
    } catch (error) {
      this.logger.error(`Failed to process mailing job ${job.id}: ${error.message}`, error.stack);
      
      // Re-throw the error to mark the job as failed
      throw error;
    }
  }
}
