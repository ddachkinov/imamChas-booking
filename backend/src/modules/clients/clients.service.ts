import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProfile, ClientStatus } from './entities/client-profile.entity';
import { CreateClientProfileDto } from './dto/create-client-profile.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientProfile)
    private readonly clientRepository: Repository<ClientProfile>,
  ) {}

  async create(tenantId: string, createClientDto: CreateClientProfileDto): Promise<ClientProfile> {
    const client = this.clientRepository.create({
      ...createClientDto,
      tenant_id: tenantId,
    });
    return this.clientRepository.save(client);
  }

  async findAll(tenantId: string, businessId?: string, includeInactive: boolean = false): Promise<ClientProfile[]> {
    const query = this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.user', 'user')
      .where('client.tenant_id = :tenantId', { tenantId });

    if (businessId) {
      query.andWhere('client.business_id = :businessId', { businessId });
    }

    if (!includeInactive) {
      query.andWhere('client.status = :status', { status: ClientStatus.ACTIVE });
    }

    query.orderBy('client.created_at', 'DESC');

    return query.getMany();
  }

  async findOne(tenantId: string, id: string): Promise<ClientProfile> {
    const client = await this.clientRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['user'],
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  async update(tenantId: string, id: string, updateClientDto: UpdateClientProfileDto): Promise<ClientProfile> {
    const client = await this.findOne(tenantId, id);
    Object.assign(client, updateClientDto);
    return this.clientRepository.save(client);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const client = await this.findOne(tenantId, id);
    await this.clientRepository.softRemove(client);
  }
}
