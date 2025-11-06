import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateClientProfileDto } from './create-client-profile.dto';

export class UpdateClientProfileDto extends PartialType(OmitType(CreateClientProfileDto, ['user_id', 'business_id'] as const)) {}
