import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';
import { ServiceAddon } from './entities/service-addon.entity';
import { LocationService } from './entities/location-service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service, ServiceAddon, LocationService])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService, TypeOrmModule],
})
export class ServicesModule {}
