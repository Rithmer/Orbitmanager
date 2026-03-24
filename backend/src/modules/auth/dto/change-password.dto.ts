import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { StrongPasswordConstraint } from '@/common/validators/strong-password';

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPassword123!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  currentPassword!: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  @StrongPasswordConstraint()
  newPassword!: string;
}
