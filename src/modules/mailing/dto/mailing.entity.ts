import { ApiProperty } from '@nestjs/swagger';

export class MailingJobDataEntity {
  @ApiProperty({ description: 'Mailing campaign ID' })
  mailingId: string;

  @ApiProperty({ description: 'URL to the XLSX file' })
  fileUrl: string;

  @ApiProperty({ description: 'Message to send to contacts' })
  message: string;
}

export class BullQueueJobEntity {
  @ApiProperty({ description: 'Job ID' })
  id: string | number;

  @ApiProperty({ description: 'Job status' })
  status: string;

  @ApiProperty({ description: 'Job progress (0-100)' })
  progress: number;

  @ApiProperty({ description: 'Job data', type: MailingJobDataEntity })
  data: MailingJobDataEntity;

  @ApiProperty({ description: 'Job creation timestamp' })
  createdAt: number;

  @ApiProperty({ description: 'Job processing timestamp', required: false })
  processedAt?: number;

  @ApiProperty({ description: 'Job completion timestamp', required: false })
  finishedAt?: number;

  @ApiProperty({ description: 'Job failure reason', required: false })
  failedReason?: string;

  @ApiProperty({ description: 'Number of attempts made' })
  attemptsMade: number;

  @ApiProperty({ description: 'Job delay in milliseconds', required: false })
  delay?: number;
}

export class BullQueueStatsEntity {
  @ApiProperty({ description: 'Total number of jobs in queue' })
  total: number;

  @ApiProperty({ description: 'Number of waiting jobs' })
  waiting: number;

  @ApiProperty({ description: 'Number of active jobs' })
  active: number;

  @ApiProperty({ description: 'Number of completed jobs' })
  completed: number;

  @ApiProperty({ description: 'Number of failed jobs' })
  failed: number;
}

export class BullQueueDataEntity {
  @ApiProperty({ description: 'Total number of jobs for this mailing' })
  totalJobs: number;

  @ApiProperty({ description: 'Number of waiting jobs' })
  waiting: number;

  @ApiProperty({ description: 'Number of active jobs' })
  active: number;

  @ApiProperty({ description: 'Number of completed jobs' })
  completed: number;

  @ApiProperty({ description: 'Number of failed jobs' })
  failed: number;

  @ApiProperty({ description: 'Array of jobs', type: [BullQueueJobEntity] })
  jobs: BullQueueJobEntity[];

  @ApiProperty({ description: 'Overall queue statistics', type: BullQueueStatsEntity })
  queueStats: BullQueueStatsEntity;
}

export class MailingEntity {
  @ApiProperty({ description: 'Unique mailing ID' })
  id: string;

  @ApiProperty({ description: 'Name of the mailing campaign' })
  name: string;

  @ApiProperty({ description: 'URL to the uploaded file' })
  url: string;

  @ApiProperty({ description: 'Message to send to contacts' })
  message: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'BullMQ queue data for this mailing', type: BullQueueDataEntity })
  bullQueue: BullQueueDataEntity;
}
