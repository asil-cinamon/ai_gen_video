import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue, Job } from 'bullmq';
import IORedis from 'ioredis';

const DEFAULT_QUEUE_NAME = 'video-jobs';
const PLAIN_QUEUE_LIST = 'video_jobs';

@Injectable()
export class JobsService implements OnModuleDestroy {
  private queue: Queue;
  private redisClient: IORedis.Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const connection = { connection: { url: redisUrl } } as any;
    this.queue = new Queue(DEFAULT_QUEUE_NAME, connection);
    this.redisClient = new IORedis(redisUrl);
  }

  async enqueueJob(jobId: string, payload: any): Promise<Job | null> {
    // enqueue to BullMQ for Node consumers
    const job = await this.queue.add(jobId, { jobId, payload }, { removeOnComplete: 1000, attempts: 3, backoff: { type: 'exponential', delay: 5000 } });

    // also push a plain list entry for external workers (e.g., Python) to consume via BRPOP
    try {
      const entry = JSON.stringify({ jobId, payload });
      await this.redisClient.lpush(PLAIN_QUEUE_LIST, entry);
    } catch (e) {
      // non-fatal: log to console for now
      // In production, record this in monitoring
      // eslint-disable-next-line no-console
      console.warn('Failed to push plain redis job entry', e);
    }

    return job;
  }

  async getJobStatus(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) return { jobId, status: 'NOT_FOUND' };
    return { jobId, status: job.finishedOn ? 'SUCCESS' : job.processedOn ? 'RUNNING' : job.failedReason ? 'FAILED' : 'PENDING', failedReason: job.failedReason };
  }

  async close() {
    try {
      await this.queue.close();
    } catch (_) {}
    try {
      await this.redisClient.quit();
    } catch (_) {}
  }

  async onModuleDestroy() {
    await this.close();
  }
}
