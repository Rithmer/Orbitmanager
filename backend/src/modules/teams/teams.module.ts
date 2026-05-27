import { Module } from '@nestjs/common';
import { TeamRolesGuard } from '@/common/guards/team-roles.guard';
import { TeamsController } from './teams.controller';
import { TeamMembersController } from './team-members.controller';
import { TeamsService } from './teams.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [TeamsController, TeamMembersController],
  providers: [TeamsService, TeamRolesGuard],
  exports: [TeamsService],
})
export class TeamsModule {}
