import { SetMetadata } from '@nestjs/common';
import { TeamRole } from '../enums/team-role.enum';

export const TEAM_ROLES_KEY = 'teamRoles';
export const TeamRoles = (...roles: TeamRole[]) =>
  SetMetadata(TEAM_ROLES_KEY, roles);
