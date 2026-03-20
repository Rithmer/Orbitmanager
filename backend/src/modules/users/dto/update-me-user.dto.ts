import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMeUserDto {
  @ApiPropertyOptional({ example: 'Иванов Иван Иванович' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: 'Backend Developer' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  profession?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  aiHintsEnabled?: boolean;
}
