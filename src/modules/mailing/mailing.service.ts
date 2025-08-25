import { Injectable, NotFoundException } from '@nestjs/common';
import type { Knex } from 'nestjs-knex';
import { InjectKnex } from 'nestjs-knex';
import { Mailing, MailingWithQueues, CreateMailingData, UpdateMailingData } from './interfaces/mailing.interface';
import { CreateMailingDto } from './dto/mailing.dto';
import { UpdateMailingDto } from './dto/mailing.dto';
import { MailingJobData } from './mailing-queue.processor';
import { MailingQueueManagerService } from './mailing-queue-manager.service';

@Injectable()
export class MailingService {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    private readonly mailingQueueManager: MailingQueueManagerService,
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

  async findAll(includeQueueData: boolean = true): Promise<MailingWithQueues[]> {
    const mailings = await this.knex('mailing')
      .orderBy('createdAt', 'desc');

    // If queue data is not needed, return mailings without queue info
    if (!includeQueueData) {
      return mailings.map(mailing => ({
        ...mailing,
        bullQueue: this.getEmptyQueueData(),
      }));
    }

    // Get all mailing IDs to batch fetch queue data
    const mailingIds = mailings.map(mailing => mailing.id);
    
    // Batch fetch queue data for all mailings at once
    const queueDataMap = await this.getBatchBullQueueData(mailingIds);

    // Map the data back to mailings
    const mailingsWithQueues = mailings.map((mailing) => ({
      ...mailing,
      bullQueue: queueDataMap[mailing.id] || this.getEmptyQueueData(),
    }));

    return mailingsWithQueues;
  }

  async findAllBasic(): Promise<Mailing[]> {
    return this.knex('mailing')
      .orderBy('createdAt', 'desc');
  }

  private async getBatchBullQueueData(mailingIds: string[]): Promise<Record<string, any>> {
    try {
      const queueDataMap: Record<string, any> = {};
      
      // Process each mailing queue in parallel with a concurrency limit
      const concurrencyLimit = 5; // Limit concurrent queue operations
      const chunks = this.chunkArray(mailingIds, concurrencyLimit);
      
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (mailingId) => {
          try {
            const queueData = await this.getBullQueueData(mailingId);
            return { mailingId, queueData };
          } catch (error) {
            console.error(`Error fetching queue data for mailing ${mailingId}:`, error);
            return { mailingId, queueData: this.getEmptyQueueData() };
          }
        });
        
        const chunkResults = await Promise.all(chunkPromises);
        chunkResults.forEach(({ mailingId, queueData }) => {
          queueDataMap[mailingId] = queueData;
        });
      }
      
      return queueDataMap;
    } catch (error) {
      console.error('Error in batch queue data fetch:', error);
      // Return empty data for all mailings if batch fetch fails
      return mailingIds.reduce((acc, id) => {
        acc[id] = this.getEmptyQueueData();
        return acc;
      }, {} as Record<string, any>);
    }
  }

  private getEmptyQueueData() {
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

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async getBullQueueData(mailingId: string) {
    try {
      // Get the queue from the queue manager
      const queue = await this.mailingQueueManager.getQueue(mailingId);
      
      if (!queue) {
        return this.getEmptyQueueData();
      }
      
      // Get all jobs and filter by mailingId
      const allJobs = await queue.getJobs(['waiting', 'active', 'completed', 'failed']);

      const mailingJobs = allJobs.filter(job => job.data.mailingId === mailingId);
      
      // Get job states properly using BullMQ API
      const jobsWithState = await Promise.all(
        mailingJobs.map(async (job) => {
          const state = await job.getState();
          return { ...job, state };
        })
      );
      
      // Count jobs by status
      const waiting = jobsWithState.filter(job => job.state === 'waiting');
      const active = jobsWithState.filter(job => job.state === 'active');
      const completed = jobsWithState.filter(job => job.state === 'completed');
      const failed = jobsWithState.filter(job => job.state === 'failed');

      return {
        totalJobs: mailingJobs.length,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        jobs: jobsWithState.map(job => ({
          id: job.id,
          status: job.state,
          progress: job.progress,
          data: job.data,
          createdAt: job.timestamp,
          processedAt: job.processedOn,
          finishedAt: job.finishedOn,
          failedReason: job.failedReason,
          attemptsMade: job.attemptsMade,
          delay: job.delay || 0,
        })),
        queueStats: {
          total: mailingJobs.length,
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
        },
      };
    } catch (error) {
      console.error(`Error fetching BullMQ data for mailing ${mailingId}:`, error);
      return this.getEmptyQueueData();
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
