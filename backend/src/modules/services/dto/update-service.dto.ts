import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto';

export class UpdateServiceDto extends PartialType(OmitType(CreateServiceDto, ['business_id'] as const)) {}
