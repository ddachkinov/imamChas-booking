import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business, BusinessStatus } from './entities/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async create(tenantId: string, createBusinessDto: CreateBusinessDto): Promise<Business> {
    const business = this.businessRepository.create({
      ...createBusinessDto,
      tenant_id: tenantId,
    });

    return this.businessRepository.save(business);
  }

  async findAll(tenantId: string, includeInactive: boolean = false): Promise<Business[]> {
    const query = this.businessRepository
      .createQueryBuilder('business')
      .where('business.tenant_id = :tenantId', { tenantId });

    if (!includeInactive) {
      query.andWhere('business.status = :status', { status: BusinessStatus.ACTIVE });
    }

    query.orderBy('business.created_at', 'DESC');

    return query.getMany();
  }

  async findOne(tenantId: string, id: string): Promise<Business> {
    const business = await this.businessRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    return business;
  }

  async findByTenant(tenantId: string): Promise<Business> {
    const business = await this.businessRepository.findOne({
      where: { tenant_id: tenantId, status: BusinessStatus.ACTIVE },
      order: { created_at: 'ASC' }, // Get the first (primary) business
    });

    if (!business) {
      throw new NotFoundException(`No active business found for tenant`);
    }

    return business;
  }

  async update(tenantId: string, id: string, updateBusinessDto: UpdateBusinessDto): Promise<Business> {
    const business = await this.findOne(tenantId, id);

    Object.assign(business, updateBusinessDto);

    return this.businessRepository.save(business);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const business = await this.findOne(tenantId, id);

    // Soft delete
    await this.businessRepository.softRemove(business);
  }

  async isActive(tenantId: string, businessId: string): Promise<boolean> {
    const business = await this.findOne(tenantId, businessId);
    return business.status === BusinessStatus.ACTIVE;
  }

  async validateBusinessBelongsToTenant(tenantId: string, businessId: string): Promise<void> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId, tenant_id: tenantId },
    });

    if (!business) {
      throw new BadRequestException('Business does not belong to this tenant');
    }
  }
}
