import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './common/cache/cache.module';
import { ReadModelsModule } from './common/read-models/read-models.module';
import { envValidationSchema } from './config/env.validation';
import { StorageModule } from './infrastructure/storage/storage.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TeamsModule } from './modules/teams/teams.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RiskModule } from './modules/risk/risk.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { ProjectBoardModule } from './modules/project-board/project-board.module';
import { CalendarViewModule } from './modules/calendar-view/calendar-view.module';
import { TeamsListViewModule } from './modules/teams-list-view/teams-list-view.module';
import { ProjectsListViewModule } from './modules/projects-list-view/projects-list-view.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    CacheModule,
    ReadModelsModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: parseInt(process.env['THROTTLE_TTL'] ?? '60000', 10),
          limit: parseInt(process.env['THROTTLE_LIMIT'] ?? '180', 10),
        },
      ],
    }),
    StorageModule,
    UsersModule,
    AuthModule,
    TeamsListViewModule,
    ProjectsListViewModule,
    TeamsModule,
    ProjectsModule,
    TasksModule,
    AuditLogsModule,
    DashboardModule,
    RiskModule,
    CalendarModule,
    ProjectBoardModule,
    CalendarViewModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
