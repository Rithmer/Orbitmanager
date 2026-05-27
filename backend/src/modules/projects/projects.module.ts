import { Module } from '@nestjs/common';
import { AccessModule } from '@/common/access/access.module';
import { AccountRolesGuard } from '@/common/guards/account-roles.guard';
import { ProjectRolesGuard } from '@/common/guards/project-roles.guard';
import { ProjectsController } from './projects.controller';
import { ProjectMembersController } from './project-members.controller';
import { ProjectsService } from './projects.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule, AccessModule],
  controllers: [ProjectsController, ProjectMembersController],
  providers: [ProjectsService, AccountRolesGuard, ProjectRolesGuard],
  exports: [ProjectsService],
})
export class ProjectsModule {}
