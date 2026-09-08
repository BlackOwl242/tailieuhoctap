import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import * as express from 'express';
import pino from 'pino';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger as NestLogger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { validateEnv } from './config/env.validation';
import configuration from './config/configuration';

async function bootstrap(): Promise<void> {
  validateEnv(process.env);
  const cfg = configuration();

  const logger = pino({
    level: cfg.logLevel,
    base: { app: 'kms-api', env: cfg.env },
    timestamp: pino.stdTimeFunctions.isoTime,
  });

  const app = await NestFactory.create(AppModule, { logger: false, rawBody: false });

  // Request id correlation (echoed back in every response and every log line)
  app.use((req: express.Request & { requestId?: string }, res: express.Response, next: express.NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  // Structured JSON request logs
  app.use(new LoggingInterceptor(logger).expressMiddleware());

  const origins = cfg.corsOrigin === '*' ? true : cfg.corsOrigin.split(',').map((o) => o.trim());
  app.enableCors({ origin: origins, credentials: true, maxAge: 86400 });

  // Static attachment storage (random uuid filenames; see README assumptions)
  app.use('/uploads', express.static(cfg.uploadDir, { maxAge: '7d', immutable: true }));

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('HRMIS Pro & KMS Unified API')
    .setDescription('Hệ thống Thông tin Quản trị Nhân lực Toàn diện — RESTful API (v1)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(cfg.port, '0.0.0.0');

  const nestLogger = new NestLogger('Bootstrap');
  nestLogger.log(`API listening on http://0.0.0.0:${cfg.port} (env=${cfg.env})`);
  nestLogger.log(`Swagger UI: http://localhost:${cfg.port}/api/docs`);
  nestLogger.log(`Demo admin account: ${cfg.defaultAdminEmail} (seeded on first run when DB is empty)`);
}

void bootstrap();
