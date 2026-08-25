import type { NextFunction, Request, Response } from 'express';
import type { Logger as PinoLogger } from 'pino';

/** Structured JSON request logging with duration + request id correlation. */
export class LoggingInterceptor {
  constructor(private readonly logger: PinoLogger) {}

  expressMiddleware() {
    return (req: Request & { requestId?: string; user?: { id?: string } }, res: Response, next: NextFunction): void => {
      const startAt = process.hrtime.bigint();
      res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startAt) / 1_000_000;
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        this.logger[level](
          {
            requestId: req.requestId,
            userId: req.user?.id,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: Math.round(durationMs * 100) / 100,
          },
          'http_request',
        );
      });
      next();
    };
  }
}
