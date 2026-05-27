import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDateString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCalendarEventDto {
  @ApiProperty({ example: 'Встреча по спринту', description: 'Название' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Обсуждение задач на неделю' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    example: '2026-03-20T10:00:00.000Z',
    description: 'Начало (ISO 8601)',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    example: '2026-03-20T11:00:00.000Z',
    description: 'Конец (ISO 8601)',
  })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ example: false, description: 'Событие на весь день' })
  @IsBoolean()
  @IsOptional()
  allDay?: boolean;

  @ApiPropertyOptional({
    example: '#3b82f6',
    description: 'Цвет события (hex)',
  })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'color must be a valid hex color' })
  color?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID проекта (опционально)' })
  @IsInt()
  @IsOptional()
  projectId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID задачи (опционально)' })
  @IsInt()
  @IsOptional()
  taskId?: number;
}
