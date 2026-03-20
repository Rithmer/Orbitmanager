import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountRole } from '@/common/enums/account-role.enum';

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
    example: 'secureP@ss1',
    description: 'РџР°СЂРѕР»СЊ (РјРёРЅ. 8 СЃРёРјРІРѕР»РѕРІ)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @ApiProperty({
    example: 'РРІР°РЅРѕРІ РРІР°РЅ',
    description: 'РџРѕР»РЅРѕРµ РёРјСЏ',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;

  @ApiPropertyOptional({
    example: 'Backend Developer',
    description: 'РџСЂРѕС„РµСЃСЃРёСЏ',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  profession?: string;

  @ApiPropertyOptional({ enum: AccountRole, default: AccountRole.MEMBER })
  @IsEnum(AccountRole)
  @IsOptional()
  accountRole?: AccountRole;

  @ApiPropertyOptional({
    enum: ['active', 'blocked', 'inactive'],
    default: 'active',
  })
  @IsIn(['active', 'blocked', 'inactive'])
  @IsOptional()
  accountStatus?: 'active' | 'blocked' | 'inactive';
}
