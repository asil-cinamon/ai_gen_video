import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  // Initialize Sentry if DSN provided
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    Sentry.init({ dsn, environment: process.env.NODE_ENV || 'development' });
    console.log('Sentry initialized');
  }

  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '50mb' }));
  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap();
