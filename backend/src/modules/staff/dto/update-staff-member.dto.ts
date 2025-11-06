import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateStaffMemberDto } from './create-staff-member.dto';

export class UpdateStaffMemberDto extends PartialType(OmitType(CreateStaffMemberDto, ['user_id', 'business_id'] as const)) {}
