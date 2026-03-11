import { IsInt, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '../../../common/enums/project-role.enum';

export class AddProjectMemberDto {
  @ApiProperty({ example: 2, description: 'ID пользователя' })
  @IsInt()
  userId!: number;

  @ApiProperty({ enum: ProjectRole, example: ProjectRole.DEVELOPER })
  @IsEnum(ProjectRole)
  role!: ProjectRole;
}
