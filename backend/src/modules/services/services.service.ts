import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { BusinessesService } from '../businesses/businesses.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly businessesService: BusinessesService,
  ) {}

  async create(tenantId: string, createServiceDto: CreateServiceDto): Promise<Service> {
    // Validate that the business belongs to the tenant
    try {
      await this.businessesService.findOne(tenantId, createServiceDto.business_id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new ForbiddenException(
          'You do not have permission to create services for this business',
        );
      }
      throw error;
    }

    const service = this.serviceRepository.create({
      ...createServiceDto,
      tenant_id: tenantId,
    });
    return this.serviceRepository.save(service);
  }

  async findAll(
    tenantId: string,
    businessId?: string,
    includeInactive: boolean = false,
    search?: string,
    category?: string,
    isActive?: boolean,
    minPrice?: number,
    maxPrice?: number,
    limit?: number,
    offset?: number,
  ): Promise<Service[]> {
    const query = this.buildServiceQuery(
      tenantId,
      businessId,
      includeInactive,
      search,
      category,
      isActive,
      minPrice,
      maxPrice,
    );

    query.orderBy('service.sort_order', 'ASC').addOrderBy('service.name', 'ASC');

    if (limit !== undefined) {
      query.limit(limit);
    }

    if (offset !== undefined) {
      query.offset(offset);
    }

    return query.getMany();
  }

  async count(
    tenantId: string,
    businessId?: string,
    includeInactive: boolean = false,
    search?: string,
    category?: string,
    isActive?: boolean,
    minPrice?: number,
    maxPrice?: number,
  ): Promise<number> {
    const query = this.buildServiceQuery(
      tenantId,
      businessId,
      includeInactive,
      search,
      category,
      isActive,
      minPrice,
      maxPrice,
    );

    return query.getCount();
  }

  private buildServiceQuery(
    tenantId: string,
    businessId?: string,
    includeInactive: boolean = false,
    search?: string,
    category?: string,
    isActive?: boolean,
    minPrice?: number,
    maxPrice?: number,
  ) {
    const query = this.serviceRepository
      .createQueryBuilder('service')
      .where('service.tenant_id = :tenantId', { tenantId });

    if (businessId) {
      query.andWhere('service.business_id = :businessId', { businessId });
    }

    if (search) {
      query.andWhere(
        '(service.name ILIKE :search OR service.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      query.andWhere('service.category = :category', { category });
    }

    if (isActive !== undefined) {
      query.andWhere('service.is_active = :isActive', { isActive });
    } else if (!includeInactive) {
      query.andWhere('service.is_active = :isActive', { isActive: true });
    }

    if (minPrice !== undefined) {
      query.andWhere('service.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      query.andWhere('service.price <= :maxPrice', { maxPrice });
    }

    return query;
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

  async duplicate(tenantId: string, id: string): Promise<Service> {
    const originalService = await this.findOne(tenantId, id);

    // Create a copy without the id and timestamps
    const { id: _, created_at, updated_at, deleted_at, ...serviceData } = originalService;

    // Modify the name to indicate it's a copy
    const copyName = `${serviceData.name} (Copy)`;

    const duplicatedService = this.serviceRepository.create({
      ...serviceData,
      name: copyName,
      tenant_id: tenantId,
    });

    return this.serviceRepository.save(duplicatedService);
  }

  async bulkDeactivate(tenantId: string, serviceIds: string[]): Promise<void> {
    // Verify all services belong to the tenant
    const services = await this.serviceRepository.find({
      where: serviceIds.map(id => ({ id, tenant_id: tenantId })),
    });

    if (services.length !== serviceIds.length) {
      throw new NotFoundException('One or more services not found');
    }

    // Update all services to inactive status
    await this.serviceRepository
      .createQueryBuilder()
      .update(Service)
      .set({ is_active: false })
      .where('id IN (:...serviceIds)', { serviceIds })
      .andWhere('tenant_id = :tenantId', { tenantId })
      .execute();
  }
}
