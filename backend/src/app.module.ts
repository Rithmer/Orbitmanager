import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envValidationSchema } from './config/env.validation';
import { StorageModule } from './infrastructure/storage/storage.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TeamsModule } from './modules/teams/teams.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { RiskModule } from './modules/risk/risk.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          // TTL в миллисекундах: 60000 = 60 секунд
          ttl: parseInt(process.env['THROTTLE_TTL'] ?? '60000', 10),
          // Максимум запросов за TTL-период
          limit: parseInt(process.env['THROTTLE_LIMIT'] ?? '60', 10),
        },
      ],
    }),
    StorageModule,
    UsersModule,
    AuthModule,
    TeamsModule,
    ProjectsModule,
    TasksModule,
    AuditLogsModule,
    RiskModule,
    CalendarModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Регистрация LoggingInterceptor через DI позволяет инжектировать
    // NestJS Logger, который направляет вывод в Winston (настроенный в main.ts)
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
