import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TeamRole } from '../../../common/enums/team-role.enum';

export class UpdateTeamMemberDto {
  @ApiProperty({ enum: TeamRole, example: TeamRole.MEMBER })
  @IsEnum(TeamRole)
  teamRole!: TeamRole;
}
