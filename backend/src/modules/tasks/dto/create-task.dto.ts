import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsInt,
  IsArray,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ example: 1, description: 'ID проекта' })
  @IsInt()
  projectId!: number;

  @ApiProperty({
    example: 'Реализовать авторизацию',
    description: 'Название задачи',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    example: 'Реализовать JWT авторизацию с access и refresh токенами',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    example: '2026-04-01T00:00:00.000Z',
    description: 'Дедлайн (ISO 8601)',
  })
  @IsDateString()
  deadline!: string;

  @ApiProperty({ example: 3, description: 'Сложность задачи (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty!: number;

  @ApiPropertyOptional({
    example: [2, 3],
    description: 'ID исполнителей (участники проекта)',
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  assigneeIds?: number[];
}
