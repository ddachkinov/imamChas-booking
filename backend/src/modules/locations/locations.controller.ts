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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Locations')
@ApiBearerAuth()
@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new location' })
  @ApiResponse({ status: 201, description: 'Location created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Request() req, @Body() createLocationDto: CreateLocationDto) {
    const tenantId = req.user.tenant_id;
    return this.locationsService.create(tenantId, createLocationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all locations for tenant' })
  @ApiQuery({ name: 'businessId', required: false, type: String })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of locations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Request() req,
    @Query('businessId') businessId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const tenantId = req.user.tenant_id;
    const includeInactiveFlag = includeInactive === 'true';
    return this.locationsService.findAll(tenantId, businessId, includeInactiveFlag);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location by ID' })
  @ApiResponse({ status: 200, description: 'Location found' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Request() req, @Param('id') id: string) {
    const tenantId = req.user.tenant_id;
    return this.locationsService.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update location' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    const tenantId = req.user.tenant_id;
    return this.locationsService.update(tenantId, id, updateLocationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete location (soft delete)' })
  @ApiResponse({ status: 204, description: 'Location deleted successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Request() req, @Param('id') id: string) {
    const tenantId = req.user.tenant_id;
    await this.locationsService.remove(tenantId, id);
    return { message: 'Location deleted successfully' };
  }
}
