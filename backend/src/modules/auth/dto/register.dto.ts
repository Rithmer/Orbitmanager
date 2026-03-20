import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'john_doe',
    description:
      'Р›РѕРіРёРЅ (3-50 СЃРёРјРІРѕР»РѕРІ, Р±РµР· СЃРїРµС†СЃРёРјРІРѕР»РѕРІ)',
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

  @ApiProperty({ example: 'РРІР°РЅРѕРІ РРІР°РЅ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;

  @ApiPropertyOptional({ example: 'Backend Developer' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  profession?: string;
}
