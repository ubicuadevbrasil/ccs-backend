import { Injectable, NotFoundException } from '@nestjs/common';
import type { Knex } from 'nestjs-knex';
import { InjectKnex } from 'nestjs-knex';
import { Mailing, MailingWithQueues, CreateMailingData, UpdateMailingData } from './interfaces/mailing.interface';
import { CreateMailingDto } from './dto/mailing.dto';
import { UpdateMailingDto } from './dto/mailing.dto';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { MailingJobData } from './mailing-queue.processor';

@Injectable()
export class MailingService {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    @InjectQueue('mailing') private readonly mailingQueue: Queue<MailingJobData>,
  ) {}

  async create(createMailingDto: CreateMailingDto): Promise<Mailing> {
    const [mailing] = await this.knex('mailing')
      .insert({
        ...createMailingDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning('*');

    return mailing;
  }

  async findAll(): Promise<MailingWithQueues[]> {
    const mailings = await this.knex('mailing')
      .orderBy('createdAt', 'desc');

    // Get BullMQ queue data for each mailing
    const mailingsWithQueues = await Promise.all(
      mailings.map(async (mailing) => {
        const bullQueueData = await this.getBullQueueData(mailing.id);
        
        return {
          ...mailing,
          bullQueue: bullQueueData,
        };
      })
    );

    return mailingsWithQueues;
  }

  private async getBullQueueData(mailingId: string) {
    try {
      // Get all jobs for this mailing
      const allJobs = await this.mailingQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
      
      // Filter jobs for this specific mailing
      const mailingJobs = allJobs.filter(job => job.data.mailingId === mailingId);
      
      // Get queue statistics
      const [waiting, active, completed, failed] = await Promise.all([
        this.mailingQueue.getWaiting(),
        this.mailingQueue.getActive(),
        this.mailingQueue.getCompleted(),
        this.mailingQueue.getFailed(),
      ]);

      // Filter by mailing ID
      const mailingWaiting = waiting.filter(job => job.data.mailingId === mailingId);
      const mailingActive = active.filter(job => job.data.mailingId === mailingId);
      const mailingCompleted = completed.filter(job => job.data.mailingId === mailingId);
      const mailingFailed = failed.filter(job => job.data.mailingId === mailingId);

      return {
        totalJobs: mailingJobs.length,
        waiting: mailingWaiting.length,
        active: mailingActive.length,
        completed: mailingCompleted.length,
        failed: mailingFailed.length,
        jobs: mailingJobs.map(job => ({
          id: job.id,
          status: (job as any).status,
          progress: job.progress(),
          data: job.data,
          createdAt: job.timestamp,
          processedAt: job.processedOn,
          finishedAt: job.finishedOn,
          failedReason: job.failedReason,
          attemptsMade: job.attemptsMade,
          delay: (job as any).delay,
        })),
        queueStats: {
          total: await this.mailingQueue.count(),
          waiting: await this.mailingQueue.getWaitingCount(),
          active: await this.mailingQueue.getActiveCount(),
          completed: await this.mailingQueue.getCompletedCount(),
          failed: await this.mailingQueue.getFailedCount(),
        },
      };
    } catch (error) {
      console.error(`Error fetching BullMQ data for mailing ${mailingId}:`, error);
      return {
        totalJobs: 0,
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        jobs: [],
        queueStats: {
          total: 0,
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
        },
      };
    }
  }



  async findOne(id: string): Promise<Mailing> {
    const mailing = await this.knex('mailing')
      .where({ id })
      .first();

    if (!mailing) {
      throw new NotFoundException(`Mailing with ID ${id} not found`);
    }

    return mailing;
  }

  async findOneWithQueues(id: string): Promise<MailingWithQueues> {
    const mailing = await this.knex('mailing')
      .where({ id })
      .first();

    if (!mailing) {
      throw new NotFoundException(`Mailing with ID ${id} not found`);
    }

    // Get BullMQ queue data for this mailing
    const bullQueueData = await this.getBullQueueData(mailing.id);

    return {
      ...mailing,
      bullQueue: bullQueueData,
    };
  }

  async update(id: string, updateMailingDto: UpdateMailingDto): Promise<Mailing> {
    const [mailing] = await this.knex('mailing')
      .where({ id })
      .update({
        ...updateMailingDto,
        updatedAt: new Date(),
      })
      .returning('*');

    if (!mailing) {
      throw new NotFoundException(`Mailing with ID ${id} not found`);
    }

    return mailing;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.knex('mailing')
      .where({ id })
      .del();

    if (!deleted) {
      throw new NotFoundException(`Mailing with ID ${id} not found`);
    }
  }
}
