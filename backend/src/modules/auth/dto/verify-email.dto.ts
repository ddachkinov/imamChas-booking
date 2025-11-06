import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token from email',
    example: 'abc123xyz789...',
  })
  @IsString()
  token: string;
}
