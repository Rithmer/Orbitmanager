import { TeamRole } from '../../common/enums/team-role.enum';

export interface TeamMember {
  id: number;
  userId: number;
  teamId: number;
  teamRole: TeamRole;
}
