import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(tenantId: string, createServiceDto: CreateServiceDto): Promise<Service> {
    const service = this.serviceRepository.create({
      ...createServiceDto,
      tenant_id: tenantId,
    });
    return this.serviceRepository.save(service);
  }

  async findAll(tenantId: string, businessId?: string, includeInactive: boolean = false): Promise<Service[]> {
    console.log('[ServicesService.findAll] Called with:', { tenantId, businessId, includeInactive });

    const query = this.serviceRepository
      .createQueryBuilder('service')
      .where('service.tenant_id = :tenantId', { tenantId });

    if (businessId) {
      query.andWhere('service.business_id = :businessId', { businessId });
    }

    if (!includeInactive) {
      query.andWhere('service.is_active = :isActive', { isActive: true });
    }

    query.orderBy('service.name', 'ASC');

    const sql = query.getQuery();
    const params = query.getParameters();
    console.log('[ServicesService.findAll] SQL:', sql);
    console.log('[ServicesService.findAll] Params:', params);

    const results = await query.getMany();
    console.log('[ServicesService.findAll] Results count:', results.length);
    return results;
  }

  async findOne(tenantId: string, id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async update(tenantId: string, id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(tenantId, id);
    Object.assign(service, updateServiceDto);
    return this.serviceRepository.save(service);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const service = await this.findOne(tenantId, id);
    await this.serviceRepository.softRemove(service);
  }
}
