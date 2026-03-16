import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoModule } from './video/video.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), VideoModule, JobsModule],
})
export class AppModule {}
