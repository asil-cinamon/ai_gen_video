import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateVideoDto } from './dto/create-video.dto';
import { JobsService } from '../jobs/jobs.service';

type JobRecord = {
  id: string;
  status: string;
  input: any;
  resultUrl?: string | null;
  error?: string | null;
};

const inMemoryJobs = new Map<string, JobRecord>();

@Injectable()
export class VideoService {
  constructor(private readonly jobsService: JobsService) {}

  async createJob(dto: CreateVideoDto): Promise<JobRecord> {
    const id = uuidv4();
    const record: JobRecord = {
      id,
      status: 'PENDING',
      input: dto,
      resultUrl: null,
      error: null,
    };
    inMemoryJobs.set(id, record);

    // Enqueue job to BullMQ
    try {
      await this.jobsService.enqueueJob(id, { input: dto });
    } catch (err) {
      record.status = 'FAILED';
      record.error = String(err);
    }

    return record;
  }

  async getStatus(jobId: string) {
    const r = inMemoryJobs.get(jobId);
    if (!r) return { jobId, status: 'NOT_FOUND' };
    // complement with queue status
    const q = await this.jobsService.getJobStatus(jobId);
    return { jobId: r.id, status: q.status ?? r.status, error: r.error ?? q.failedReason };
  }

  async getResult(jobId: string) {
    const r = inMemoryJobs.get(jobId);
    if (!r) return { jobId, status: 'NOT_FOUND' };
    return { jobId: r.id, status: r.status, resultUrl: r.resultUrl };
  }
}
