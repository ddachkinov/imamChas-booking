import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location, LocationStatus } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async create(tenantId: string, createLocationDto: CreateLocationDto): Promise<Location> {
    const location = this.locationRepository.create({
      ...createLocationDto,
      tenant_id: tenantId,
    });

    return this.locationRepository.save(location);
  }

  async findAll(tenantId: string, businessId?: string, includeInactive: boolean = false): Promise<Location[]> {
    const query = this.locationRepository
      .createQueryBuilder('location')
      .where('location.tenant_id = :tenantId', { tenantId });

    if (businessId) {
      query.andWhere('location.business_id = :businessId', { businessId });
    }

    if (!includeInactive) {
      query.andWhere('location.status = :status', { status: LocationStatus.ACTIVE });
    }

    query.orderBy('location.created_at', 'DESC');

    return query.getMany();
  }

  async findOne(tenantId: string, id: string): Promise<Location> {
    const location = await this.locationRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['business'],
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return location;
  }

  async findByBusiness(tenantId: string, businessId: string): Promise<Location[]> {
    return this.locationRepository.find({
      where: {
        tenant_id: tenantId,
        business_id: businessId,
        status: LocationStatus.ACTIVE
      },
      order: { created_at: 'ASC' },
    });
  }

  async getPrimaryLocation(tenantId: string, businessId: string): Promise<Location> {
    const location = await this.locationRepository.findOne({
      where: {
        tenant_id: tenantId,
        business_id: businessId,
        status: LocationStatus.ACTIVE
      },
      order: { created_at: 'ASC' },
    });

    if (!location) {
      throw new NotFoundException(`No active location found for business`);
    }

    return location;
  }

  async update(tenantId: string, id: string, updateLocationDto: UpdateLocationDto): Promise<Location> {
    const location = await this.findOne(tenantId, id);

    Object.assign(location, updateLocationDto);

    return this.locationRepository.save(location);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const location = await this.findOne(tenantId, id);

    // Soft delete
    await this.locationRepository.softRemove(location);
  }

  async isActive(tenantId: string, locationId: string): Promise<boolean> {
    const location = await this.findOne(tenantId, locationId);
    return location.status === LocationStatus.ACTIVE;
  }

  async validateLocationBelongsToTenant(tenantId: string, locationId: string): Promise<void> {
    const location = await this.locationRepository.findOne({
      where: { id: locationId, tenant_id: tenantId },
    });

    if (!location) {
      throw new BadRequestException('Location does not belong to this tenant');
    }
  }

  async validateLocationBelongsToBusiness(businessId: string, locationId: string): Promise<void> {
    const location = await this.locationRepository.findOne({
      where: { id: locationId, business_id: businessId },
    });

    if (!location) {
      throw new BadRequestException('Location does not belong to this business');
    }
  }
}
