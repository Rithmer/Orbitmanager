import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectMembersController } from './project-members.controller';
import { ProjectsService } from './projects.service';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import { ProjectsJsonRepository } from '../../infrastructure/repositories/json/projects.json.repository';
import { PROJECT_MEMBER_REPOSITORY } from '../../domain/repositories/project-member.repository';
import { ProjectMembersJsonRepository } from '../../infrastructure/repositories/json/project-members.json.repository';
import { TEAM_MEMBER_REPOSITORY } from '../../domain/repositories/team-member.repository';
import { TeamMembersJsonRepository } from '../../infrastructure/repositories/json/team-members.json.repository';
import { TEAM_REPOSITORY } from '../../domain/repositories/team.repository';
import { TeamsJsonRepository } from '../../infrastructure/repositories/json/teams.json.repository';

@Module({
  controllers: [ProjectsController, ProjectMembersController],
  providers: [
    ProjectsService,
    { provide: PROJECT_REPOSITORY, useClass: ProjectsJsonRepository },
    { provide: PROJECT_MEMBER_REPOSITORY, useClass: ProjectMembersJsonRepository },
    { provide: TEAM_MEMBER_REPOSITORY, useClass: TeamMembersJsonRepository },
    { provide: TEAM_REPOSITORY, useClass: TeamsJsonRepository },
  ],
  exports: [
    ProjectsService,
    { provide: PROJECT_REPOSITORY, useClass: ProjectsJsonRepository },
    { provide: PROJECT_MEMBER_REPOSITORY, useClass: ProjectMembersJsonRepository },
  ],
})
export class ProjectsModule {}
