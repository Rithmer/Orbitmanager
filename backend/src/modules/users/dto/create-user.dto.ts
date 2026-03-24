import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountRole } from '@/common/enums/account-role.enum';
import { StrongPasswordConstraint } from '@/common/validators/strong-password';

export class CreateUserDto {
  @ApiProperty({
    example: 'john_doe',
    description:
      'РЈРЅРёРєР°Р»СЊРЅС‹Р№ Р»РѕРіРёРЅ (3-50 СЃРёРјРІРѕР»РѕРІ, Р±РµР· СЃРїРµС†СЃРёРјРІРѕР»РѕРІ)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message:
      'Р›РѕРіРёРЅ РјРѕР¶РµС‚ СЃРѕРґРµСЂР¶Р°С‚СЊ С‚РѕР»СЊРєРѕ Р±СѓРєРІС‹, С†РёС„СЂС‹ Рё СЃРёРјРІРѕР» РїРѕРґС‡С‘СЂРєРёРІР°РЅРёСЏ',
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

  @ApiProperty({
    example: 'РРІР°РЅРѕРІ РРІР°РЅ',
    description: 'РџРѕР»РЅРѕРµ РёРјСЏ',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({ example: 'Backend Developer', description: 'Профессия' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  profession?: string;

  @ApiPropertyOptional({ default: 'active', description: 'Статус аккаунта' })
  @IsString()
  @IsOptional()
  accountStatus?: 'active' | 'blocked';

  @ApiPropertyOptional({ enum: AccountRole, default: AccountRole.MEMBER })
  @IsEnum(AccountRole)
  @IsOptional()
  accountRole?: AccountRole;
}
