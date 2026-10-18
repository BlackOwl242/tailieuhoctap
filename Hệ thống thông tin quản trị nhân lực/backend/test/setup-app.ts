import { INestApplication, ValidationPipe } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import pino from 'pino';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

export function setupTestApp(app: INestApplication) {
  const database = new URL(process.env.DATABASE_URL || 'postgresql://invalid/invalid').pathname;
  if (!/e2e|test|review/i.test(database)) throw new Error('E2E requires a dedicated test/review database; never run against the application database');
  app.setGlobalPrefix('api/v1');
  app.use((req: { requestId?: string }, _res: unknown, next: () => void) => { req.requestId = randomUUID(); next(); });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter(pino({ level: 'silent' })));
}
