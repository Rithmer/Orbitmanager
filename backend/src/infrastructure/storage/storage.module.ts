import { Module, Global } from '@nestjs/common';
import { JsonFileService } from './json-file.service';
import { PrismaService } from '../prisma/prisma.service';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { TEAM_REPOSITORY } from '../../domain/repositories/team.repository';
import { TEAM_MEMBER_REPOSITORY } from '../../domain/repositories/team-member.repository';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import { PROJECT_MEMBER_REPOSITORY } from '../../domain/repositories/project-member.repository';
import { TASK_REPOSITORY } from '../../domain/repositories/task.repository';
import { AUDIT_LOG_REPOSITORY } from '../../domain/repositories/audit-log.repository';
import { UsersJsonRepository } from '../repositories/json/users.json.repository';
import { TeamsJsonRepository } from '../repositories/json/teams.json.repository';
import { TeamMembersJsonRepository } from '../repositories/json/team-members.json.repository';
import { ProjectsJsonRepository } from '../repositories/json/projects.json.repository';
import { ProjectMembersJsonRepository } from '../repositories/json/project-members.json.repository';
import { TasksJsonRepository } from '../repositories/json/tasks.json.repository';
import { AuditLogsJsonRepository } from '../repositories/json/audit-logs.json.repository';
import { UsersPrismaRepository } from '../repositories/prisma/users.prisma.repository';
import { TeamsPrismaRepository } from '../repositories/prisma/teams.prisma.repository';
import { TeamMembersPrismaRepository } from '../repositories/prisma/team-members.prisma.repository';
import { ProjectsPrismaRepository } from '../repositories/prisma/projects.prisma.repository';
import { ProjectMembersPrismaRepository } from '../repositories/prisma/project-members.prisma.repository';
import { TasksPrismaRepository } from '../repositories/prisma/tasks.prisma.repository';
import { AuditLogsPrismaRepository } from '../repositories/prisma/audit-logs.prisma.repository';

const jsonProviders = [
  { provide: USER_REPOSITORY, useClass: UsersJsonRepository },
  { provide: TEAM_REPOSITORY, useClass: TeamsJsonRepository },
  { provide: TEAM_MEMBER_REPOSITORY, useClass: TeamMembersJsonRepository },
  { provide: PROJECT_REPOSITORY, useClass: ProjectsJsonRepository },
  { provide: PROJECT_MEMBER_REPOSITORY, useClass: ProjectMembersJsonRepository },
  { provide: TASK_REPOSITORY, useClass: TasksJsonRepository },
  { provide: AUDIT_LOG_REPOSITORY, useClass: AuditLogsJsonRepository },
];

const prismaProviders = [
  { provide: USER_REPOSITORY, useClass: UsersPrismaRepository },
  { provide: TEAM_REPOSITORY, useClass: TeamsPrismaRepository },
  { provide: TEAM_MEMBER_REPOSITORY, useClass: TeamMembersPrismaRepository },
  { provide: PROJECT_REPOSITORY, useClass: ProjectsPrismaRepository },
  { provide: PROJECT_MEMBER_REPOSITORY, useClass: ProjectMembersPrismaRepository },
  { provide: TASK_REPOSITORY, useClass: TasksPrismaRepository },
  { provide: AUDIT_LOG_REPOSITORY, useClass: AuditLogsPrismaRepository },
];

@Global()
@Module({})
export class StorageModule {
  static register() {
    const storageMode = process.env['STORAGE_MODE'] ?? 'json';
    const isPostgres = storageMode === 'postgres';

    const repoProviders = isPostgres ? prismaProviders : jsonProviders;
    const infraProviders = isPostgres ? [PrismaService] : [JsonFileService];
    const infraExports = isPostgres ? [PrismaService] : [JsonFileService];

    return {
      module: StorageModule,
      providers: [...infraProviders, ...repoProviders],
      exports: [...infraExports, ...repoProviders],
    };
  }
}
