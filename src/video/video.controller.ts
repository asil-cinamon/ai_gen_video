import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { VideoService } from './video.service';
import { CreateVideoDto } from './dto/create-video.dto';

@Controller('api/v1/videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post()
  async create(@Body() dto: CreateVideoDto) {
    const job = await this.videoService.createJob(dto);
    return { jobId: job.id };
  }

  @Get(':jobId/status')
  async status(@Param('jobId') jobId: string) {
    return this.videoService.getStatus(jobId);
  }

  @Get(':jobId/result')
  async result(@Param('jobId') jobId: string) {
    return this.videoService.getResult(jobId);
  }
}
