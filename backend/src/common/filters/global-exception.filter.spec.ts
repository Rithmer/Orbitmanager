import {
  ArgumentsHost,
  BadRequestException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

type MockResponse = {
  status: jest.Mock;
  json: jest.Mock;
};

function createHttpHost(
  response: MockResponse,
  request: { method: string; url: string },
): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as ArgumentsHost;
}

describe('GlobalExceptionFilter', () => {
  const originalNodeEnv = process.env['NODE_ENV'];

  afterEach(() => {
    process.env['NODE_ENV'] = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it('formats HttpException object response', () => {
    process.env['NODE_ENV'] = 'test';
    const filter = new GlobalExceptionFilter();
    const response: MockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const host = createHttpHost(response, { method: 'GET', url: '/api' });
    const exception = new BadRequestException({
      error: 'Bad Request',
      message: ['field is required', 'field must be string'],
      details: [{ field: 'name' }],
    });

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'field is required; field must be string',
        details: [{ field: 'name' }],
      }),
    );
  });

  it('formats HttpException primitive response', () => {
    process.env['NODE_ENV'] = 'test';
    const filter = new GlobalExceptionFilter();
    const response: MockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const host = createHttpHost(response, { method: 'GET', url: '/api' });
    const exception = new BadRequestException('invalid payload');

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'invalid payload',
      }),
    );
  });

  it('hides internal details for unknown errors in production', () => {
    process.env['NODE_ENV'] = 'production';
    const filter = new GlobalExceptionFilter();
    const response: MockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const host = createHttpHost(response, { method: 'POST', url: '/risk' });
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    filter.catch(new Error('boom'), host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'InternalServerError',
        message: 'Сервис временно недоступен. Попробуйте позже.',
        details: [],
      }),
    );
    expect(loggerSpy).toHaveBeenCalled();
  });
});
