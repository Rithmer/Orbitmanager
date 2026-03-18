import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let error: string;
    let message: string;
    let details: unknown[] = [];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        error = (resp['error'] as string) ?? HttpStatus[statusCode] ?? 'Error';
        message = Array.isArray(resp['message'])
          ? (resp['message'] as string[]).join('; ')
          : ((resp['message'] as string) ?? exception.message);
        details = (resp['details'] as unknown[]) ?? [];
      } else {
        error = HttpStatus[statusCode] ?? 'Error';
        message = String(exceptionResponse);
      }
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'InternalServerError';
      message = 'Internal server error';

      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(statusCode).json({
      statusCode,
      error,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
