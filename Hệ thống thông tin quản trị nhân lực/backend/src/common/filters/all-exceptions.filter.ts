import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { Logger as PinoLogger } from 'pino';
import { BusinessException } from '../errors/business.exception';

interface ErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details: unknown;
  path: string | undefined;
  requestId: string | null;
  timestamp: string;
}

/**
 * Centralized error handler — every failure leaves the API as ONE structured
 * JSON shape so the frontend can render it safely without string parsing.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { requestId?: string }>();

    let status = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Lỗi hệ thống, vui lòng thử lại sau.';
    let details: unknown = null;

    if (exception instanceof BusinessException) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
      details = exception.details ?? null;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (response && typeof response === 'object') {
        const r = response as Record<string, unknown>;
        if (Array.isArray(r['message'])) {
          code = 'VALIDATION_ERROR';
          message = 'Dữ liệu không hợp lệ';
          details = r['message'];
        } else {
          message = (r['message'] as string) || exception.message || message;
          details = (r['error'] as unknown) ?? null;
        }
      }
      if (status === 401) code = 'UNAUTHORIZED';
      else if (status === 403) code = code === 'VALIDATION_ERROR' ? code : 'FORBIDDEN';
      else if (status === 404) code = 'NOT_FOUND';
      else if (status === 409) code = 'CONFLICT';
      else if (status === 429) code = 'RATE_LIMITED';
      else if (status >= 500) code = 'INTERNAL_ERROR';
    } else {
      this.logger.error(
        { err: exception instanceof Error ? { message: exception.message, stack: exception.stack } : exception, requestId: req.requestId },
        'unhandled_exception',
      );
    }

    const body: ErrorBody = {
      statusCode: status,
      code,
      message,
      details,
      path: req.url,
      requestId: req.requestId ?? null,
      timestamp: new Date().toISOString(),
    };
    void (res as unknown as { status(s: number): Response }).status(status).json(body);
  }
}

export type { NextFunction };
