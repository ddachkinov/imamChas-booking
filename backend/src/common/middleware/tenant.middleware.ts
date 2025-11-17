import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';

// Extend Express Request to include tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
      tenantId?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract subdomain from host header
      const host = req.headers.host || req.hostname;
      const subdomain = this.extractSubdomain(host);

      // For public/health endpoints, skip tenant resolution
      if (req.path.startsWith('/health') || req.path.startsWith('/api/docs')) {
        return next();
      }

      // If no subdomain or it's the main domain, skip for now
      // (In production, you might want to redirect to a marketing site)
      if (!subdomain || subdomain === 'www' || subdomain === 'api') {
        // For API calls without subdomain, check if tenant is in query/body
        const tenantIdentifier = req.query.tenant || (req.body as any)?.tenant;

        if (tenantIdentifier) {
          const tenant = await this.findTenantByIdentifier(tenantIdentifier as string);
          if (tenant) {
            req.tenant = tenant;
            req.tenantId = tenant.id;
          }
        }

        return next();
      }

      // Find tenant by subdomain
      const tenant = await this.tenantRepository.findOne({
        where: { subdomain, status: 'active' },
        cache: {
          id: `tenant_subdomain_${subdomain}`,
          milliseconds: 60000, // Cache for 1 minute
        },
      });

      if (!tenant) {
        throw new NotFoundException(
          `Tenant not found for subdomain: ${subdomain}`,
        );
      }

      // Check if tenant subscription is active
      if (tenant.subscription_status === 'cancelled' || tenant.subscription_status === 'expired') {
        return res.status(403).json({
          statusCode: 403,
          message: 'This account has been suspended. Please contact support.',
        });
      }

      // Attach tenant to request
      req.tenant = tenant;
      req.tenantId = tenant.id;

      next();
    } catch (error) {
      next(error);
    }
  }

  private extractSubdomain(host: string): string | null {
    // Remove port if present
    const hostWithoutPort = host.split(':')[0];

    // Split by dots
    const parts = hostWithoutPort.split('.');

    // If localhost or IP address, no subdomain
    if (hostWithoutPort === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostWithoutPort)) {
      return null;
    }

    // For domain like subdomain.example.com, return subdomain
    // For domain like example.com, return null
    if (parts.length >= 3) {
      return parts[0];
    }

    return null;
  }

  private async findTenantByIdentifier(identifier: string): Promise<Tenant | null> {
    // Try to find by subdomain first
    let tenant = await this.tenantRepository.findOne({
      where: { subdomain: identifier, status: 'active' },
    });

    // If not found, try by slug
    if (!tenant) {
      tenant = await this.tenantRepository.findOne({
        where: { slug: identifier, status: 'active' },
      });
    }

    // If still not found, try by ID (if it's a valid UUID)
    if (!tenant && this.isValidUUID(identifier)) {
      tenant = await this.tenantRepository.findOne({
        where: { id: identifier, status: 'active' },
      });
    }

    return tenant;
  }

  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}
