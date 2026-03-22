import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountRole } from '@/common/enums/account-role.enum';
import { StrongPasswordConstraint } from '@/common/validators/strong-password';

export class CreateUserDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'Уникальный логин (3-50 символов, без спецсимволов)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Логин может содержать только буквы, цифры и символ подчёркивания',
  })
  login!: string;

  @ApiProperty({
    example: 'SecurePass1!',
    description:
      'Пароль: мин. 8 символов, строчные и прописные латинские буквы, цифра и спецсимвол',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @StrongPasswordConstraint()
  password!: string;

  @ApiProperty({ example: 'Иванов Иван', description: 'Полное имя' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;

  @ApiPropertyOptional({ example: 'Backend Developer', description: 'Профессия' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  profession?: string;

  @ApiPropertyOptional({ enum: AccountRole, default: AccountRole.MEMBER })
  @IsEnum(AccountRole)
  @IsOptional()
  accountRole?: AccountRole;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatars/1.png', description: 'URL аватара или Base64' })
  @IsString()
  @IsOptional()
  @MaxLength(5000000)
  avatarUrl?: string | null;
}
