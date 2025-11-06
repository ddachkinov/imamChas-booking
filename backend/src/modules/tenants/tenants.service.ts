import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Find tenant by ID
   */
  async findById(id: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { id },
    });
  }

  /**
   * Find tenant by slug
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { slug },
    });
  }

  /**
   * Create a new tenant
   */
  async create(tenantData: Partial<Tenant>): Promise<Tenant> {
    const tenant = this.tenantRepository.create(tenantData);
    return this.tenantRepository.save(tenant);
  }

  /**
   * Update tenant
   */
  async update(id: string, updateData: Partial<Tenant>): Promise<Tenant> {
    await this.tenantRepository.update(id, updateData);
    const tenant = await this.findById(id);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  /**
   * Check if tenant is active
   */
  async isActive(id: string): Promise<boolean> {
    const tenant = await this.findById(id);
    return tenant && tenant.subscription_status === 'active';
  }

  /**
   * Check if tenant subscription is valid
   */
  async hasValidSubscription(id: string): Promise<boolean> {
    const tenant = await this.findById(id);

    if (!tenant) {
      return false;
    }

    // Check subscription status
    if (tenant.subscription_status === 'suspended' || tenant.subscription_status === 'cancelled') {
      return false;
    }

    // Check expiration date if set
    if (tenant.subscription_expires_at) {
      return new Date() < tenant.subscription_expires_at;
    }

    return true;
  }

  /**
   * Get tenant feature flags
   */
  async getFeatureFlags(id: string): Promise<Record<string, boolean>> {
    const tenant = await this.findById(id);
    return tenant?.feature_flags || {};
  }

  /**
   * Check if tenant has a specific feature enabled
   */
  async hasFeature(id: string, featureName: string): Promise<boolean> {
    const features = await this.getFeatureFlags(id);
    return features[featureName] === true;
  }

  /**
   * Delete tenant (soft delete)
   */
  async delete(id: string): Promise<void> {
    await this.tenantRepository.softDelete(id);
  }
}
