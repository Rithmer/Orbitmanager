import { Module } from '@nestjs/common';
import { CacheModule } from '@/common/cache/cache.module';
import { AccountRolesGuard } from '@/common/guards/account-roles.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule, CacheModule],
  controllers: [UsersController],
  providers: [UsersService, AccountRolesGuard],
  exports: [UsersService],
})
export class UsersModule {}
