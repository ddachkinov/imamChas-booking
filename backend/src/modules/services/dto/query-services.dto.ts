import { IsOptional, IsUUID, IsBoolean, IsString, IsNumber, IsInt, Min, Max, MaxLength, Matches } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryServicesDto {
  @ApiPropertyOptional({
    description: 'Business ID to filter services',
    example: '569b40aa-b46a-448a-87fa-05b619ce174a',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Business ID must be a valid UUID' })
  businessId?: string;

  @ApiPropertyOptional({
    description: 'Include inactive services',
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

  @ApiPropertyOptional({
    description: 'Search query for service name or description',
    example: 'haircut',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Search query cannot exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message: 'Search query contains invalid characters',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by service category',
    example: 'hair',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Category cannot exceed 50 characters' })
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum price filter',
    example: 10.00,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_price?: number;

  @ApiPropertyOptional({
    description: 'Maximum price filter',
    example: 100.00,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_price?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    example: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Number of results to skip',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
