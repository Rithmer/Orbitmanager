import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

/**
 * Перехватчик для логирования аудит-событий на уровне HTTP-запросов.
 * Дополняет точечный аудит в сервисах общей записью о мутирующих операциях.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;

    // Only log mutating operations
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user = req.user as { id?: number; login?: string } | undefined;
    const url = req.url;

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `[AUDIT] ${method} ${url} — user #${user?.id ?? 'anon'} (${user?.login ?? '?'})`,
        );
      }),
    );
  }
}
