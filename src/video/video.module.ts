import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoJobEntity } from './entities/video-job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VideoJobEntity])],
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}
