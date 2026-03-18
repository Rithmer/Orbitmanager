import {
  IsString,
  IsOptional,
  MaxLength,
  IsInt,
  IsBoolean,
  IsDateString,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCalendarEventDto {
  @ApiPropertyOptional({ example: 'Обновлённое название' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Обновлённое описание' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: '2026-03-20T10:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-03-20T11:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  allDay?: boolean;

  @ApiPropertyOptional({ example: '#ef4444' })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'color must be a valid hex color' })
  color?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  projectId?: number | null;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  taskId?: number | null;
}
