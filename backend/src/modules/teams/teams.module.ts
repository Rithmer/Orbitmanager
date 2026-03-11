import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamMembersController } from './team-members.controller';
import { TeamsService } from './teams.service';
import { TEAM_REPOSITORY } from '../../domain/repositories/team.repository';
import { TeamsJsonRepository } from '../../infrastructure/repositories/json/teams.json.repository';
import { TEAM_MEMBER_REPOSITORY } from '../../domain/repositories/team-member.repository';
import { TeamMembersJsonRepository } from '../../infrastructure/repositories/json/team-members.json.repository';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { UsersJsonRepository } from '../../infrastructure/repositories/json/users.json.repository';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import { ProjectsJsonRepository } from '../../infrastructure/repositories/json/projects.json.repository';
import { PROJECT_MEMBER_REPOSITORY } from '../../domain/repositories/project-member.repository';
import { ProjectMembersJsonRepository } from '../../infrastructure/repositories/json/project-members.json.repository';

@Module({
  controllers: [TeamsController, TeamMembersController],
  providers: [
    TeamsService,
    { provide: TEAM_REPOSITORY, useClass: TeamsJsonRepository },
    { provide: TEAM_MEMBER_REPOSITORY, useClass: TeamMembersJsonRepository },
    { provide: USER_REPOSITORY, useClass: UsersJsonRepository },
    { provide: PROJECT_REPOSITORY, useClass: ProjectsJsonRepository },
    { provide: PROJECT_MEMBER_REPOSITORY, useClass: ProjectMembersJsonRepository },
  ],
  exports: [
    TeamsService,
    { provide: TEAM_MEMBER_REPOSITORY, useClass: TeamMembersJsonRepository },
  ],
})
export class TeamsModule {}
