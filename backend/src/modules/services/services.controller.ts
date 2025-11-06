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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created' })
  create(@Request() req, @Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(req.user.tenant_id, createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({ status: 200, description: 'List of services' })
  findAll(@Request() req, @Query('businessId') businessId?: string, @Query('includeInactive') includeInactive?: string) {
    return this.servicesService.findAll(req.user.tenant_id, businessId, includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({ status: 200, description: 'Service found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.servicesService.findOne(req.user.tenant_id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update service' })
  @ApiResponse({ status: 200, description: 'Service updated' })
  update(@Request() req, @Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(req.user.tenant_id, id, updateServiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete service' })
  @ApiResponse({ status: 204, description: 'Service deleted' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.servicesService.remove(req.user.tenant_id, id);
    return { message: 'Service deleted successfully' };
  }
}
