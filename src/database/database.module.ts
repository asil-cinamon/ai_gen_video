import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoJobEntity } from '../video/entities/video-job.entity';
import * as fs from 'fs';
import * as path from 'path';

const defaultDatabasePath = 'data/sqlite.db';
const databasePath = process.env.DATABASE_URL || defaultDatabasePath;

if (!process.env.DATABASE_URL) {
  const dir = path.dirname(defaultDatabasePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: databasePath,
      entities: [VideoJobEntity],
      synchronize: process.env.NODE_ENV === 'development',
      logging: false,
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
