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
import { ClientsService } from './clients.service';
import { CreateClientProfileDto } from './dto/create-client-profile.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create client profile' })
  @ApiResponse({ status: 201, description: 'Client profile created' })
  create(@Request() req, @Body() createClientDto: CreateClientProfileDto) {
    return this.clientsService.create(req.user.tenant_id, createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all client profiles' })
  @ApiResponse({ status: 200, description: 'List of client profiles' })
  findAll(@Request() req, @Query() query: QueryClientsDto) {
    return this.clientsService.findAll(req.user.tenant_id, query.businessId, query.includeInactive || false);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client profile by ID' })
  @ApiResponse({ status: 200, description: 'Client profile found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.clientsService.findOne(req.user.tenant_id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update client profile' })
  @ApiResponse({ status: 200, description: 'Client profile updated' })
  update(@Request() req, @Param('id') id: string, @Body() updateClientDto: UpdateClientProfileDto) {
    return this.clientsService.update(req.user.tenant_id, id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete client profile' })
  @ApiResponse({ status: 204, description: 'Client profile deleted' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.clientsService.remove(req.user.tenant_id, id);
    return { message: 'Client profile deleted successfully' };
  }
}
