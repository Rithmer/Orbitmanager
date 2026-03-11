import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.UNPROCESSABLE_ENTITY) {
    super(
      {
        statusCode,
        error: 'BusinessError',
        message,
        details: [],
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}
