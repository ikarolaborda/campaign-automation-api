import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../../src/health/health.controller';
import { DataSource } from 'typeorm';
import { EmailService } from '../../src/email/email.service';
import { EmailQueueService } from '../../src/queue/email-queue.service';

describe('HealthController', () => {
  let controller: HealthController;
  let dataSource: jest.Mocked<DataSource>;
  let emailService: jest.Mocked<EmailService>;
  let emailQueueService: jest.Mocked<EmailQueueService>;

  beforeEach(async () => {
    const mockDataSource = {
      query: jest.fn(),
    };

    const mockEmailService = {
      testConnection: jest.fn(),
    };

    const mockEmailQueueService = {
      getQueueStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: EmailQueueService,
          useValue: mockEmailQueueService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    dataSource = module.get(DataSource);
    emailService = module.get(EmailService);
    emailQueueService = module.get(EmailQueueService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return basic health status', () => {
      const result = controller.getHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
    });
  });

  describe('getDatabaseHealth', () => {
    it('should return healthy database status', async () => {
      dataSource.query.mockResolvedValue([{ result: 1 }]);

      const result = await controller.getDatabaseHealth();

      expect(result).toEqual({
        status: 'ok',
        database: 'connected',
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
      });
      expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    });
  });

  describe('getEmailHealth', () => {
    it('should return healthy email status', async () => {
      emailService.testConnection.mockResolvedValue(true);

      const result = await controller.getEmailHealth();

      expect(result).toEqual({
        status: 'ok',
        email: 'connected',
      });
    });

    it('should return unhealthy email status', async () => {
      emailService.testConnection.mockResolvedValue(false);

      const result = await controller.getEmailHealth();

      expect(result).toEqual({
        status: 'error',
        email: 'disconnected',
      });
    });
  });

  describe('getQueueHealth', () => {
    it('should return healthy queue status', async () => {
      emailQueueService.getQueueStatus.mockResolvedValue({
        messageCount: 5,
        consumerCount: 1,
      });

      const result = await controller.getQueueHealth();

      expect(result).toEqual({
        status: 'ok',
        queue: { messageCount: 5, consumerCount: 1 },
      });
    });

    it('should return unhealthy queue status', async () => {
      emailQueueService.getQueueStatus.mockResolvedValue({
        messageCount: -1,
        consumerCount: -1,
      });

      const result = await controller.getQueueHealth();

      expect(result).toEqual({
        status: 'error',
        queue: { messageCount: -1, consumerCount: -1 },
      });
    });
  });
}); 