import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from '../../../src/messaging/services/messaging.service';
import { Campaign } from '../../../src/campaign/entities/campaign.entity';
import { User } from '../../../src/user/entities/user.entity';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';

describe('MessagingService', () => {
  let service: MessagingService;
  let clientProxy: jest.Mocked<ClientProxy>;

  const mockCampaign: Campaign = {
    id: 'test-campaign-id',
    name: 'Test Campaign',
    targetAudience: {
      ageRange: { min: 25, max: 45 },
      countries: ['US', 'CA'],
    },
    messageTemplate: 'Hello {name} from {country}! You are {age} years old.',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: User = {
    id: 'test-user-id',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    country: 'US',
    isActive: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockClientProxy = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: 'MESSAGING_SERVICE',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
    clientProxy = module.get('MESSAGING_SERVICE');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendCampaignMessages', () => {
    it('should send messages to all users', async () => {
      const users = [mockUser];
      clientProxy.emit.mockReturnValue(of({}));

      const result = await service.sendCampaignMessages(mockCampaign, users);

      expect(result).toBe(1);
      expect(clientProxy.emit).toHaveBeenCalledWith('campaign_message', {
        campaign: mockCampaign,
        user: mockUser,
      });
    });

    it('should handle large number of users in chunks', async () => {
      const users = Array(150).fill(null).map((_, index) => ({
        ...mockUser,
        id: `user-${index}`,
        email: `user${index}@example.com`,
      }));
      clientProxy.emit.mockReturnValue(of({}));

      const result = await service.sendCampaignMessages(mockCampaign, users);

      expect(result).toBe(150);
      expect(clientProxy.emit).toHaveBeenCalledTimes(150);
    });

    it('should return 0 for empty user array', async () => {
      const result = await service.sendCampaignMessages(mockCampaign, []);

      expect(result).toBe(0);
      expect(clientProxy.emit).not.toHaveBeenCalled();
    });
  });

  describe('processCampaignMessage', () => {
    it('should process campaign message', async () => {
      const data = { campaign: mockCampaign, user: mockUser };

      await expect(service.processCampaignMessage(data)).resolves.toBeUndefined();
    });
  });

  describe('formatMessage', () => {
    it('should format message template with user data', () => {
      const template = 'Hello {name} from {country}! You are {age} years old. Email: {email}';
      
      // Access private method through any casting for testing
      const formattedMessage = (service as any).formatMessage(template, mockUser);

      expect(formattedMessage).toBe(
        'Hello John Doe from US! You are 30 years old. Email: john@example.com'
      );
    });

    it('should handle template without placeholders', () => {
      const template = 'Hello everyone!';
      
      const formattedMessage = (service as any).formatMessage(template, mockUser);

      expect(formattedMessage).toBe('Hello everyone!');
    });
  });
}); 