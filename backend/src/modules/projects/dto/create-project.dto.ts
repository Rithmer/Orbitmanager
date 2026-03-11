import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsInt,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '../../../common/enums/project-status.enum';

export class CreateProjectDto {
  @ApiProperty({ example: 1, description: 'ID команды-владельца проекта' })
  @IsInt()
  teamId!: number;

  @ApiProperty({ example: 'Mobile App', description: 'Название проекта' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: 'Мобильное приложение для клиентов' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;
}
