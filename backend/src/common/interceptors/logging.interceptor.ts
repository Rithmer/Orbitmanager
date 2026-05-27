import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = ctx.getResponse<Response>();
        const duration = Date.now() - startTime;
        this.logger.log(
          `${method} ${url} ${response.statusCode} — ${duration}ms`,
        );
      }),
      catchError((err: unknown) => {
        const status = (err as { status?: number }).status ?? 500;
        const duration = Date.now() - startTime;
        if (status >= 500) {
          this.logger.error(`${method} ${url} ${status} — ${duration}ms`);
        } else {
          this.logger.warn(`${method} ${url} ${status} — ${duration}ms`);
        }
        return throwError(() => err);
      }),
    );
  }
}
