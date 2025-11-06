import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = appController.getHealth();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('environment');
    });
  });

  describe('getRoot', () => {
    it('should return API information', () => {
      const result = appController.getRoot();
      expect(result).toHaveProperty('name', 'Booking Platform API');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('documentation', '/api/docs');
      expect(result).toHaveProperty('health', '/api/health');
    });
  });
});
