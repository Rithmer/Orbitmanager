import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @IsNotEmpty()
  login!: string;

  @ApiProperty({ example: 'secureP@ss1' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
