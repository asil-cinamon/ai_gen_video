import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateVideoDto } from './dto/create-video.dto';
import { JobsService } from '../jobs/jobs.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoJobEntity } from './entities/video-job.entity';

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
  constructor(
    private readonly jobsService: JobsService,
    @InjectRepository(VideoJobEntity)
    private readonly repo: Repository<VideoJobEntity>,
  ) {}

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

    // persist to DB
    const entity = this.repo.create({ id, status: 'PENDING', input: dto });
    await this.repo.save(entity);

    // Enqueue job to BullMQ
    try {
      await this.jobsService.enqueueJob(id, { input: dto });
    } catch (err) {
      record.status = 'FAILED';
      record.error = String(err);
      // mark DB
      await this.repo.update(id, { status: 'FAILED', errorMessage: String(err) });
    }

    return record;
  }

  async getStatus(jobId: string) {
    // Try DB first
    const ent = await this.repo.findOne({ where: { id: jobId } });
    if (!ent) return { jobId, status: 'NOT_FOUND' };

    // also check queue for liveliness
    const q = await this.jobsService.getJobStatus(jobId);
    const status = q.status ?? ent.status;
    return { jobId: ent.id, status, error: ent.errorMessage ?? q.failedReason };
  }

  async getResult(jobId: string) {
    const ent = await this.repo.findOne({ where: { id: jobId } });
    if (!ent) return { jobId, status: 'NOT_FOUND' };
    return { jobId: ent.id, status: ent.status, resultUrl: ent.resultUrl };
  }

  async handleWorkerCallback(jobId: string, payload: { status: string; resultUrl?: string; error?: string }) {
    const ent = await this.repo.findOne({ where: { id: jobId } });
    if (!ent) {
      // create if missing
      const create = this.repo.create({ id: jobId, status: payload.status as any, input: null, resultUrl: payload.resultUrl ?? null, errorMessage: payload.error ?? null });
      await this.repo.save(create);
      inMemoryJobs.set(jobId, { id: jobId, status: payload.status, input: null, resultUrl: payload.resultUrl ?? null, error: payload.error ?? null });
      return create;
    }

    ent.status = payload.status as any;
    if (payload.resultUrl) ent.resultUrl = payload.resultUrl;
    if (payload.error) ent.errorMessage = payload.error;
    if (payload.status === 'SUCCESS') ent.finishedAt = new Date();
    await this.repo.save(ent);

    // update in-memory map
    const mem = inMemoryJobs.get(jobId) ?? { id: jobId, status: ent.status, input: ent.input, resultUrl: ent.resultUrl, error: ent.errorMessage };
    mem.status = ent.status;
    mem.resultUrl = ent.resultUrl;
    mem.error = ent.errorMessage;
    inMemoryJobs.set(jobId, mem);

    return ent;
  }
}
