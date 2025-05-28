import { Test, TestingModule } from '@nestjs/testing';
import { EmailQueueService } from '../../src/queue/email-queue.service';
import { EmailService } from '../../src/email/email.service';

// Mock amqplib at the top level
jest.mock('amqplib', () => ({
  connect: jest.fn(() => Promise.resolve({
    createChannel: jest.fn(() => Promise.resolve({
      assertExchange: jest.fn(),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(),
      prefetch: jest.fn(),
      publish: jest.fn(),
      consume: jest.fn(),
      checkQueue: jest.fn(),
      ack: jest.fn(),
      reject: jest.fn(),
      close: jest.fn(),
    })),
    close: jest.fn(),
  })),
}));

describe('EmailQueueService', () => {
  let service: EmailQueueService;
  let emailService: EmailService;

  beforeEach(async () => {
    const mockEmailService = {
      sendCampaignNotification: jest.fn().mockResolvedValue(true),
      sendCampaignStatusNotification: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailQueueService,
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<EmailQueueService>(EmailQueueService);
    emailService = module.get<EmailService>(EmailService);

    // Mock the connection and channel to avoid actual RabbitMQ connection
    (service as any).connection = {
      createChannel: jest.fn(),
      close: jest.fn(),
    };
    (service as any).channel = {
      assertExchange: jest.fn(),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(),
      prefetch: jest.fn(),
      publish: jest.fn().mockReturnValue(true),
      consume: jest.fn(),
      checkQueue: jest.fn().mockResolvedValue({ messageCount: 0, consumerCount: 1 }),
      ack: jest.fn(),
      reject: jest.fn(),
      close: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('queueCampaignNotification', () => {
    it('should create a campaign notification job', async () => {
      const campaignData = {
        campaignId: 'test-campaign-id',
        campaignName: 'Test Campaign',
        userEmail: 'user@example.com',
        userName: 'John Doe',
        messageTemplate: 'Hello {name}!',
        userCountry: 'USA',
      };

      const result = await service.queueCampaignNotification(campaignData);

      expect(result).toBe(true);
      expect((service as any).channel.publish).toHaveBeenCalledWith(
        'campaign_exchange',
        'email',
        expect.any(Buffer),
        expect.objectContaining({
          persistent: true,
          priority: 5,
        })
      );
    });
  });

  describe('queueStatusNotification', () => {
    it('should create a status notification job', async () => {
      const statusData = {
        email: 'admin@example.com',
        campaignName: 'Test Campaign',
        status: 'activated' as const,
        statistics: {
          totalUsers: 100,
          messagesSent: 95,
          messagesDelivered: 90,
          messagesOpened: 70,
        },
      };

      const result = await service.queueStatusNotification(statusData);

      expect(result).toBe(true);
      expect((service as any).channel.publish).toHaveBeenCalledWith(
        'campaign_exchange',
        'email',
        expect.any(Buffer),
        expect.objectContaining({
          persistent: true,
          priority: 10,
        })
      );
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status successfully', async () => {
      const result = await service.getQueueStatus();

      expect(result).toEqual({
        messageCount: 0,
        consumerCount: 1,
      });
      expect((service as any).channel.checkQueue).toHaveBeenCalledWith('email_notifications');
    });

    it('should return error status when queue check fails', async () => {
      (service as any).channel.checkQueue.mockRejectedValue(new Error('Queue error'));

      const result = await service.getQueueStatus();

      expect(result).toEqual({
        messageCount: -1,
        consumerCount: -1,
      });
    });
  });

  describe('addEmailJob', () => {
    it('should add email job successfully', async () => {
      const job = {
        type: 'campaign_notification' as const,
        data: {
          campaignId: 'test-id',
          campaignName: 'Test Campaign',
          userEmail: 'user@example.com',
          userName: 'John Doe',
          messageTemplate: 'Hello {name}!',
          userCountry: 'USA',
        },
        priority: 5,
      };

      const result = await service.addEmailJob(job);

      expect(result).toBe(true);
      expect((service as any).channel.publish).toHaveBeenCalled();
    });

    it('should handle job addition failure', async () => {
      (service as any).channel.publish.mockReturnValue(false);

      const job = {
        type: 'campaign_notification' as const,
        data: {
          campaignId: 'test-id',
          campaignName: 'Test Campaign',
          userEmail: 'user@example.com',
          userName: 'John Doe',
          messageTemplate: 'Hello {name}!',
          userCountry: 'USA',
        },
      };

      const result = await service.addEmailJob(job);

      expect(result).toBe(false);
    });
  });
}); 