import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountRole } from '../../../common/enums/account-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'john_doe', description: 'Уникальный логин' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  login!: string;

  @ApiProperty({ example: 'secureP@ss1', description: 'Пароль (мин. 6 символов)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  password!: string;

  @ApiProperty({ example: 'Иванов Иван', description: 'Полное имя' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({ example: 'Backend Developer', description: 'Профессия' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  profession!: string;

  @ApiPropertyOptional({ enum: AccountRole, default: AccountRole.MEMBER })
  @IsEnum(AccountRole)
  @IsOptional()
  accountRole?: AccountRole;
}
