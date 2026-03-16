import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue, Job } from 'bullmq';

const DEFAULT_QUEUE_NAME = 'video-jobs';

@Injectable()
export class JobsService implements OnModuleDestroy {
  private queue: Queue;

  constructor() {
    const connection = { connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' } } as any;
    this.queue = new Queue(DEFAULT_QUEUE_NAME, connection);
  }

  async enqueueJob(jobId: string, payload: any): Promise<Job | null> {
    // use jobId as jobId to make it easy to look up
    return this.queue.add(jobId, { jobId, payload }, { removeOnComplete: 1000, attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
  }

  async getJobStatus(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) return { jobId, status: 'NOT_FOUND' };
    return { jobId, status: job.finishedOn ? 'SUCCESS' : job.processedOn ? 'RUNNING' : job.failedReason ? 'FAILED' : 'PENDING', failedReason: job.failedReason };
  }

  async close() {
    await this.queue.close();
  }

  async onModuleDestroy() {
    await this.close();
  }
}
