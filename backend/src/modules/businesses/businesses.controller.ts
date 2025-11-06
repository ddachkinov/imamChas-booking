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
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Businesses')
@ApiBearerAuth()
@Controller('businesses')
@UseGuards(JwtAuthGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new business' })
  @ApiResponse({ status: 201, description: 'Business created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Request() req, @Body() createBusinessDto: CreateBusinessDto) {
    const tenantId = req.user.tenant_id;
    return this.businessesService.create(tenantId, createBusinessDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all businesses for tenant' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of businesses' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Request() req, @Query('includeInactive') includeInactive?: string) {
    const tenantId = req.user.tenant_id;
    const includeInactiveFlag = includeInactive === 'true';
    return this.businessesService.findAll(tenantId, includeInactiveFlag);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business by ID' })
  @ApiResponse({ status: 200, description: 'Business found' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Request() req, @Param('id') id: string) {
    const tenantId = req.user.tenant_id;
    return this.businessesService.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update business' })
  @ApiResponse({ status: 200, description: 'Business updated successfully' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    const tenantId = req.user.tenant_id;
    return this.businessesService.update(tenantId, id, updateBusinessDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete business (soft delete)' })
  @ApiResponse({ status: 204, description: 'Business deleted successfully' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Request() req, @Param('id') id: string) {
    const tenantId = req.user.tenant_id;
    await this.businessesService.remove(tenantId, id);
    return { message: 'Business deleted successfully' };
  }
}
