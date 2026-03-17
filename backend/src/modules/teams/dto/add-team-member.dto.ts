import { IsInt, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TeamRole } from '@/common/enums/team-role.enum';

export class AddTeamMemberDto {
  @ApiProperty({ example: 2, description: 'ID пользователя' })
  @IsInt()
  @IsNotEmpty()
  userId!: number;

  @ApiProperty({ enum: TeamRole, example: TeamRole.MEMBER })
  @IsEnum(TeamRole)
  teamRole!: TeamRole;
}
