import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const logLevel = process.env['LOG_LEVEL'] ?? 'info';
  const isProduction = process.env['NODE_ENV'] === 'production';

  const formatContext = (context: unknown): string =>
    typeof context === 'string' && context.length > 0 ? context : 'App';

  const winstonTransports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        isProduction
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(
                ({ timestamp, level, message, context }) =>
                  `${String(timestamp)} [${formatContext(context)}] ${String(level)}: ${String(message)}`,
              ),
            ),
      ),
    }),
  ];

  if (isProduction) {
    winstonTransports.push(
      new winston.transports.File({
        filename: 'logs/app.log',
        maxsize: 5 * 1024 * 1024,
        maxFiles: 5,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );
  }

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      level: logLevel,
      transports: winstonTransports,
    }),
  });
  app.enableShutdownHooks();

  app.use(helmet());
  app.enableCors({
    origin: process.env['CORS_ORIGIN']?.split(',').map((s) => s.trim()) ?? [
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription(
      'Сервис управления проектами и задачами — РТУ МИРЭА, ЭФБО-10-24',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
}
void bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
