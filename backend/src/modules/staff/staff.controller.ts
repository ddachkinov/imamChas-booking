import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffMemberDto } from './dto/create-staff-member.dto';
import { UpdateStaffMemberDto } from './dto/update-staff-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Staff')
@ApiBearerAuth()
@Controller('staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @ApiOperation({ summary: 'Create staff member' })
  @ApiResponse({ status: 201, description: 'Staff member created' })
  create(@Request() req, @Body() createStaffDto: CreateStaffMemberDto) {
    return this.staffService.create(req.user.tenant_id, createStaffDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all staff members' })
  @ApiResponse({ status: 200, description: 'List of staff members' })
  findAll(@Request() req, @Query('businessId') businessId?: string, @Query('includeInactive') includeInactive?: string) {
    return this.staffService.findAll(req.user.tenant_id, businessId, includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get staff member by ID' })
  @ApiResponse({ status: 200, description: 'Staff member found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.staffService.findOne(req.user.tenant_id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update staff member' })
  @ApiResponse({ status: 200, description: 'Staff member updated' })
  update(@Request() req, @Param('id') id: string, @Body() updateStaffDto: UpdateStaffMemberDto) {
    return this.staffService.update(req.user.tenant_id, id, updateStaffDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete staff member' })
  @ApiResponse({ status: 204, description: 'Staff member deleted' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.staffService.remove(req.user.tenant_id, id);
    return { message: 'Staff member deleted successfully' };
  }
}
