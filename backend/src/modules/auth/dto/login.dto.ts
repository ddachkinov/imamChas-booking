import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123',
  })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: 'MFA code (if MFA is enabled)',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  mfa_code?: string;
}
