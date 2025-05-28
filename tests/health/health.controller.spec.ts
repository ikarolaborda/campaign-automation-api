import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../../src/health/health.controller';
import { DataSource } from 'typeorm';

describe('HealthController', () => {
  let controller: HealthController;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const mockDataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return basic health status', () => {
      const result = controller.getHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('getDatabaseHealth', () => {
    it('should return healthy database status', async () => {
      dataSource.query.mockResolvedValue([{ result: 1 }]);

      const result = await controller.getDatabaseHealth();

      expect(result).toEqual({
        status: 'ok',
        database: 'connected',
        timestamp: expect.any(String),
      });
      expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should return unhealthy database status on error', async () => {
      const error = new Error('Database connection failed');
      dataSource.query.mockRejectedValue(error);

      const result = await controller.getDatabaseHealth();

      expect(result).toEqual({
        status: 'error',
        database: 'disconnected',
        error: 'Database connection failed',
        timestamp: expect.any(String),
      });
      expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    });
  });
}); 