import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'Backend Team', description: 'Название команды' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Команда бэкенд-разработки' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
