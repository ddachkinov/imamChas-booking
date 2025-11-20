import { IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryClientsDto {
  @ApiPropertyOptional({
    description: 'Business ID to filter client profiles',
    example: '569b40aa-b46a-448a-87fa-05b619ce174a',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Business ID must be a valid UUID' })
  businessId?: string;

  @ApiPropertyOptional({
    description: 'Include inactive client profiles',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  includeInactive?: boolean;
}
