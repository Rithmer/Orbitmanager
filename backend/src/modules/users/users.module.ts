import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { UsersJsonRepository } from '../../infrastructure/repositories/json/users.json.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USER_REPOSITORY,
      useClass: UsersJsonRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
