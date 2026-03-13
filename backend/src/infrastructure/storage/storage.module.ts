import { Module, Global } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { TEAM_REPOSITORY } from '../../domain/repositories/team.repository';
import { TEAM_MEMBER_REPOSITORY } from '../../domain/repositories/team-member.repository';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import { PROJECT_MEMBER_REPOSITORY } from '../../domain/repositories/project-member.repository';
import { TASK_REPOSITORY } from '../../domain/repositories/task.repository';
import { AUDIT_LOG_REPOSITORY } from '../../domain/repositories/audit-log.repository';
import { UsersPrismaRepository } from '../repositories/prisma/users.prisma.repository';
import { TeamsPrismaRepository } from '../repositories/prisma/teams.prisma.repository';
import { TeamMembersPrismaRepository } from '../repositories/prisma/team-members.prisma.repository';
import { ProjectsPrismaRepository } from '../repositories/prisma/projects.prisma.repository';
import { ProjectMembersPrismaRepository } from '../repositories/prisma/project-members.prisma.repository';
import { TasksPrismaRepository } from '../repositories/prisma/tasks.prisma.repository';
import { AuditLogsPrismaRepository } from '../repositories/prisma/audit-logs.prisma.repository';

const repositoryProviders = [
  { provide: USER_REPOSITORY, useClass: UsersPrismaRepository },
  { provide: TEAM_REPOSITORY, useClass: TeamsPrismaRepository },
  { provide: TEAM_MEMBER_REPOSITORY, useClass: TeamMembersPrismaRepository },
  { provide: PROJECT_REPOSITORY, useClass: ProjectsPrismaRepository },
  { provide: PROJECT_MEMBER_REPOSITORY, useClass: ProjectMembersPrismaRepository },
  { provide: TASK_REPOSITORY, useClass: TasksPrismaRepository },
  { provide: AUDIT_LOG_REPOSITORY, useClass: AuditLogsPrismaRepository },
];

@Global()
@Module({
  providers: [PrismaService, ...repositoryProviders],
  exports: [PrismaService, ...repositoryProviders],
})
export class StorageModule {}
