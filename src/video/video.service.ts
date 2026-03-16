import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateVideoDto } from './dto/create-video.dto';

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

    // TODO: enqueue to BullMQ queue and persist to DB

    return record;
  }

  async getStatus(jobId: string) {
    const r = inMemoryJobs.get(jobId);
    if (!r) return { jobId, status: 'NOT_FOUND' };
    return { jobId: r.id, status: r.status, error: r.error };
  }

  async getResult(jobId: string) {
    const r = inMemoryJobs.get(jobId);
    if (!r) return { jobId, status: 'NOT_FOUND' };
    return { jobId: r.id, status: r.status, resultUrl: r.resultUrl };
  }
}
