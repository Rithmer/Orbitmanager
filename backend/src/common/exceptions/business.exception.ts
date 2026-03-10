import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly errorCode?: string,
    public readonly details?: unknown[],
  ) {
    super(
      {
        statusCode,
        error: errorCode ?? 'BusinessError',
        message,
        details: details ?? [],
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}
