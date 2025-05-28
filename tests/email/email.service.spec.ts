import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../../src/email/email.service';

// Mock nodemailer at the top level
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
    verify: jest.fn(),
  })),
}));

describe('EmailService', () => {
  let service: EmailService;
  let mockTransporter: any;

  beforeEach(async () => {
    // Create a mock transporter
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
    
    // Replace the transporter with our mock
    (service as any).transporter = mockTransporter;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('personalizeMessage', () => {
    it('should replace placeholders in message template', () => {
      const template = 'Hello {name} from {country}! Welcome to our campaign.';
      const variables = { name: 'John', country: 'USA' };
      
      // Using reflection to test private method
      const result = (service as any).personalizeMessage(template, variables);
      
      expect(result).toBe('Hello John from USA! Welcome to our campaign.');
    });

    it('should handle missing placeholders gracefully', () => {
      const template = 'Hello {name} from {country}!';
      const variables = { name: 'John' };
      
      const result = (service as any).personalizeMessage(template, variables);
      
      expect(result).toBe('Hello John from {country}!');
    });

    it('should handle empty variables', () => {
      const template = 'Hello {name} from {country}!';
      const variables = {};
      
      const result = (service as any).personalizeMessage(template, variables);
      
      expect(result).toBe('Hello {name} from {country}!');
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test message',
      };

      const result = await service.sendEmail(emailOptions);
      
      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'Campaign Hub <noreply@campaignhub.com>',
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test message',
        html: undefined,
      });
    });

    it('should handle email sending failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test message',
      };

      const result = await service.sendEmail(emailOptions);
      
      expect(result).toBe(false);
    });
  });

  describe('sendCampaignNotification', () => {
    it('should format campaign notification correctly', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const campaignData = {
        campaignId: 'test-campaign-id',
        campaignName: 'Test Campaign',
        userEmail: 'user@example.com',
        userName: 'John Doe',
        messageTemplate: 'Hello {name}! Check out our special offer.',
        userCountry: 'USA',
      };

      const result = await service.sendCampaignNotification(campaignData);

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'Campaign Hub <noreply@campaignhub.com>',
        to: 'user@example.com',
        subject: 'Campaign Notification: Test Campaign',
        text: 'Hello John Doe! Check out our special offer.',
        html: expect.stringContaining('Test Campaign'),
      });
    });
  });

  describe('sendCampaignStatusNotification', () => {
    it('should send status notification with statistics', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await service.sendCampaignStatusNotification(
        'admin@example.com',
        'Test Campaign',
        'activated',
        {
          totalUsers: 100,
          messagesSent: 95,
          messagesDelivered: 90,
          messagesOpened: 70,
        }
      );

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'Campaign Hub <noreply@campaignhub.com>',
        to: 'admin@example.com',
        subject: 'Campaign Activated: Test Campaign',
        text: expect.stringContaining('activated'),
        html: expect.stringContaining('100'),
      });
    });

    it('should send status notification without statistics', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await service.sendCampaignStatusNotification(
        'admin@example.com',
        'Test Campaign',
        'paused'
      );

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'Campaign Hub <noreply@campaignhub.com>',
        to: 'admin@example.com',
        subject: 'Campaign Paused: Test Campaign',
        text: expect.stringContaining('paused'),
        html: expect.not.stringContaining('Campaign Statistics'),
      });
    });
  });

  describe('testConnection', () => {
    it('should return true when connection is successful', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await service.testConnection();
      
      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should return false when connection fails', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      const result = await service.testConnection();
      
      expect(result).toBe(false);
    });
  });
}); 