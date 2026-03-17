import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '@/common/enums/project-role.enum';

export class UpdateProjectMemberDto {
  @ApiProperty({ enum: ProjectRole, example: ProjectRole.DEVELOPER })
  @IsEnum(ProjectRole)
  role!: ProjectRole;
}
