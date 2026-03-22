import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StrongPasswordConstraint } from '@/common/validators/strong-password';

export class RegisterDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'Логин (3-50 символов, без спецсимволов)',
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

  @ApiProperty({ example: 'Иванов Иван' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({ example: 'Backend Developer', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  profession?: string;
}
