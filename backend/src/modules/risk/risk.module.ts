import { Module } from '@nestjs/common';
import { RiskController } from './risk.controller';
import { RiskStubService } from './risk-stub.service';
import { RISK_ASSESSMENT_SERVICE } from '../../domain/services/risk-assessment.interface';
import { TASK_REPOSITORY } from '../../domain/repositories/task.repository';
import { TasksJsonRepository } from '../../infrastructure/repositories/json/tasks.json.repository';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import { ProjectsJsonRepository } from '../../infrastructure/repositories/json/projects.json.repository';
import { PROJECT_MEMBER_REPOSITORY } from '../../domain/repositories/project-member.repository';
import { ProjectMembersJsonRepository } from '../../infrastructure/repositories/json/project-members.json.repository';
import { TEAM_MEMBER_REPOSITORY } from '../../domain/repositories/team-member.repository';
import { TeamMembersJsonRepository } from '../../infrastructure/repositories/json/team-members.json.repository';
import { AUDIT_LOG_REPOSITORY } from '../../domain/repositories/audit-log.repository';
import { AuditLogsJsonRepository } from '../../infrastructure/repositories/json/audit-logs.json.repository';

@Module({
  controllers: [RiskController],
  providers: [
    { provide: RISK_ASSESSMENT_SERVICE, useClass: RiskStubService },
    { provide: TASK_REPOSITORY, useClass: TasksJsonRepository },
    { provide: PROJECT_REPOSITORY, useClass: ProjectsJsonRepository },
    { provide: PROJECT_MEMBER_REPOSITORY, useClass: ProjectMembersJsonRepository },
    { provide: TEAM_MEMBER_REPOSITORY, useClass: TeamMembersJsonRepository },
    { provide: AUDIT_LOG_REPOSITORY, useClass: AuditLogsJsonRepository },
  ],
  exports: [RISK_ASSESSMENT_SERVICE],
})
export class RiskModule {}
