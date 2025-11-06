import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateLocationDto } from './create-location.dto';

export class UpdateLocationDto extends PartialType(OmitType(CreateLocationDto, ['business_id'] as const)) {}
