import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonFileService } from './json-file.service';
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

function getRepositoryProviders(storageMode: string) {
  if (storageMode === 'postgres') {
    // Заглушка: при подключении PostgreSQL — заменить на Prisma-реализации
    // import { UsersPrismaRepository } from '../repositories/prisma/users.prisma.repository';
    // и т.д.
    throw new Error(
      'PostgreSQL-режим ещё не реализован. Установите STORAGE_MODE=json',
    );
  }

  return [
    { provide: USER_REPOSITORY, useClass: UsersJsonRepository },
    { provide: TEAM_REPOSITORY, useClass: TeamsJsonRepository },
    { provide: TEAM_MEMBER_REPOSITORY, useClass: TeamMembersJsonRepository },
    { provide: PROJECT_REPOSITORY, useClass: ProjectsJsonRepository },
    { provide: PROJECT_MEMBER_REPOSITORY, useClass: ProjectMembersJsonRepository },
    { provide: TASK_REPOSITORY, useClass: TasksJsonRepository },
    { provide: AUDIT_LOG_REPOSITORY, useClass: AuditLogsJsonRepository },
  ];
}

@Global()
@Module({})
export class StorageModule {
  static register() {
    const storageMode = process.env['STORAGE_MODE'] ?? 'json';
    const repoProviders = getRepositoryProviders(storageMode);

    return {
      module: StorageModule,
      providers: [JsonFileService, ...repoProviders],
      exports: [JsonFileService, ...repoProviders],
    };
  }
}
