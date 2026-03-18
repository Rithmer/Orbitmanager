import { Module } from '@nestjs/common';
import { AccessModule } from '@/common/access/access.module';
import { ProjectsController } from './projects.controller';
import { ProjectMembersController } from './project-members.controller';
import { ProjectsService } from './projects.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule, AccessModule],
  controllers: [ProjectsController, ProjectMembersController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
