import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { normalizeDecimalsDeep } from '../money';

/** Chuyển tự động mọi Prisma.Decimal trong payload trả về thành number giữ tương thích JSON frontend. */
@Injectable()
export class DecimalSerializerInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => normalizeDecimalsDeep(data)));
  }
}
