import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TASK_REPOSITORY } from '../../domain/repositories/task.repository';
import { TasksJsonRepository } from '../../infrastructure/repositories/json/tasks.json.repository';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import { ProjectsJsonRepository } from '../../infrastructure/repositories/json/projects.json.repository';
import { PROJECT_MEMBER_REPOSITORY } from '../../domain/repositories/project-member.repository';
import { ProjectMembersJsonRepository } from '../../infrastructure/repositories/json/project-members.json.repository';
import { TEAM_MEMBER_REPOSITORY } from '../../domain/repositories/team-member.repository';
import { TeamMembersJsonRepository } from '../../infrastructure/repositories/json/team-members.json.repository';

@Module({
  controllers: [TasksController],
  providers: [
    TasksService,
    { provide: TASK_REPOSITORY, useClass: TasksJsonRepository },
    { provide: PROJECT_REPOSITORY, useClass: ProjectsJsonRepository },
    { provide: PROJECT_MEMBER_REPOSITORY, useClass: ProjectMembersJsonRepository },
    { provide: TEAM_MEMBER_REPOSITORY, useClass: TeamMembersJsonRepository },
  ],
  exports: [TasksService],
})
export class TasksModule {}
