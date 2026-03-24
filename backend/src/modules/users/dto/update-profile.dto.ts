import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Иванов Иван', description: 'Полное имя' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: 'Backend Developer', description: 'Профессия' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  profession?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatars/1.png', description: 'URL аватара или Base64' })
  @IsString()
  @IsOptional()
  @MaxLength(5000000)
  avatarUrl?: string | null;
}
