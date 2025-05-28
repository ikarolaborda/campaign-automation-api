import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CampaignService } from '../../../src/campaign/services/campaign.service';
import { ICampaignRepository } from '../../../src/campaign/contracts/campaign-repository.interface';
import { IUserService } from '../../../src/user/contracts/user-service.interface';
import { IMessagingService } from '../../../src/messaging/contracts/messaging-service.interface';
import { EmailQueueService } from '../../../src/queue/email-queue.service';
import { Campaign } from '../../../src/campaign/entities/campaign.entity';
import { CreateCampaignDto } from '../../../src/campaign/dto/create-campaign.dto';
import { UpdateCampaignDto } from '../../../src/campaign/dto/update-campaign.dto';
import { User } from '../../../src/user/entities/user.entity';

describe('CampaignService', () => {
  let service: CampaignService;
  let campaignRepository: jest.Mocked<ICampaignRepository>;
  let userService: jest.Mocked<IUserService>;
  let messagingService: jest.Mocked<IMessagingService>;
  let emailQueueService: jest.Mocked<EmailQueueService>;

  const mockCampaign: Campaign = {
    id: 'test-campaign-id',
    name: 'Test Campaign',
    targetAudience: {
      ageRange: { min: 25, max: 45 },
      countries: ['US', 'CA'],
    },
    messageTemplate: 'Hello {name}!',
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
    const mockCampaignRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockUserService = {
      findMatchingUsers: jest.fn(),
    };

    const mockMessagingService = {
      sendCampaignMessages: jest.fn(),
    };

    const mockEmailQueueService = {
      queueCampaignNotification: jest.fn().mockResolvedValue(true),
      queueStatusNotification: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        {
          provide: 'ICampaignRepository',
          useValue: mockCampaignRepository,
        },
        {
          provide: 'IUserService',
          useValue: mockUserService,
        },
        {
          provide: 'IMessagingService',
          useValue: mockMessagingService,
        },
        {
          provide: EmailQueueService,
          useValue: mockEmailQueueService,
        },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
    campaignRepository = module.get('ICampaignRepository');
    userService = module.get('IUserService');
    messagingService = module.get('IMessagingService');
    emailQueueService = module.get(EmailQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all campaigns', async () => {
      const campaigns = [mockCampaign];
      campaignRepository.findAll.mockResolvedValue(campaigns);

      const result = await service.findAll();

      expect(result).toEqual(campaigns);
      expect(campaignRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a campaign by id', async () => {
      campaignRepository.findById.mockResolvedValue(mockCampaign);

      const result = await service.findById('test-campaign-id');

      expect(result).toEqual(mockCampaign);
      expect(campaignRepository.findById).toHaveBeenCalledWith('test-campaign-id');
    });

    it('should throw NotFoundException when campaign not found', async () => {
      campaignRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(campaignRepository.findById).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('create', () => {
    it('should create a new campaign and queue notification if active', async () => {
      const createCampaignDto: CreateCampaignDto = {
        name: 'Test Campaign',
        targetAudience: {
          ageRange: { min: 25, max: 45 },
          countries: ['US', 'CA'],
        },
        messageTemplate: 'Hello {name}!',
        isActive: true,
      };

      campaignRepository.create.mockResolvedValue(mockCampaign);

      const result = await service.create(createCampaignDto);

      expect(result).toEqual(mockCampaign);
      expect(campaignRepository.create).toHaveBeenCalledWith(createCampaignDto);
      expect(emailQueueService.queueStatusNotification).toHaveBeenCalledWith({
        email: 'admin@campaignhub.com',
        campaignName: mockCampaign.name,
        status: 'activated',
      }, 10);
    });

    it('should create a new campaign without notification if inactive', async () => {
      const createCampaignDto: CreateCampaignDto = {
        name: 'Test Campaign',
        targetAudience: {
          ageRange: { min: 25, max: 45 },
          countries: ['US', 'CA'],
        },
        messageTemplate: 'Hello {name}!',
        isActive: false,
      };

      const inactiveCampaign = { ...mockCampaign, isActive: false };
      campaignRepository.create.mockResolvedValue(inactiveCampaign);

      const result = await service.create(createCampaignDto);

      expect(result).toEqual(inactiveCampaign);
      expect(campaignRepository.create).toHaveBeenCalledWith(createCampaignDto);
      expect(emailQueueService.queueStatusNotification).not.toHaveBeenCalled();
    });

    it('should create a new campaign without notification if isActive is undefined', async () => {
      const createCampaignDto: CreateCampaignDto = {
        name: 'Test Campaign',
        targetAudience: {
          ageRange: { min: 25, max: 45 },
          countries: ['US', 'CA'],
        },
        messageTemplate: 'Hello {name}!',
      };

      const inactiveCampaign = { ...mockCampaign, isActive: false };
      campaignRepository.create.mockResolvedValue(inactiveCampaign);

      const result = await service.create(createCampaignDto);

      expect(result).toEqual(inactiveCampaign);
      expect(campaignRepository.create).toHaveBeenCalledWith(createCampaignDto);
      expect(emailQueueService.queueStatusNotification).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a campaign without status change', async () => {
      const updateCampaignDto: UpdateCampaignDto = {
        name: 'Updated Campaign Name',
      };

      campaignRepository.findById.mockResolvedValue(mockCampaign);
      campaignRepository.update.mockResolvedValue({
        ...mockCampaign,
        ...updateCampaignDto,
      });

      const result = await service.update('test-campaign-id', updateCampaignDto);

      expect(result).toEqual({ ...mockCampaign, ...updateCampaignDto });
      expect(campaignRepository.findById).toHaveBeenCalledWith('test-campaign-id');
      expect(campaignRepository.update).toHaveBeenCalledWith(
        'test-campaign-id',
        updateCampaignDto,
      );
      expect(emailQueueService.queueStatusNotification).not.toHaveBeenCalled();
    });

    it('should update a campaign and queue notification on status change', async () => {
      const updateCampaignDto: UpdateCampaignDto = {
        isActive: false,
      };

      const matchingUsers = [mockUser];
      campaignRepository.findById.mockResolvedValue(mockCampaign);
      campaignRepository.update.mockResolvedValue({
        ...mockCampaign,
        ...updateCampaignDto,
      });
      userService.findMatchingUsers.mockResolvedValue(matchingUsers);

      const result = await service.update('test-campaign-id', updateCampaignDto);

      expect(result).toEqual({ ...mockCampaign, ...updateCampaignDto });
      expect(emailQueueService.queueStatusNotification).toHaveBeenCalledWith({
        email: 'admin@campaignhub.com',
        campaignName: mockCampaign.name,
        status: 'paused',
        statistics: {
          totalUsers: 1,
          messagesSent: 1,
          messagesDelivered: 1,
          messagesOpened: 1,
        }
      }, 10);
    });

    it('should throw NotFoundException when campaign to update is not found', async () => {
      const updateCampaignDto: UpdateCampaignDto = {
        name: 'Updated Campaign Name',
      };

      campaignRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', updateCampaignDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a campaign', async () => {
      campaignRepository.findById.mockResolvedValue(mockCampaign);
      campaignRepository.delete.mockResolvedValue(undefined);

      await service.delete('test-campaign-id');

      expect(campaignRepository.findById).toHaveBeenCalledWith('test-campaign-id');
      expect(campaignRepository.delete).toHaveBeenCalledWith('test-campaign-id');
    });

    it('should throw NotFoundException when campaign to delete is not found', async () => {
      campaignRepository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStats', () => {
    it('should return campaign statistics', async () => {
      const matchingUsers = [mockUser];
      campaignRepository.findById.mockResolvedValue(mockCampaign);
      userService.findMatchingUsers.mockResolvedValue(matchingUsers);

      const result = await service.getStats('test-campaign-id');

      expect(result).toEqual({
        campaignId: mockCampaign.id,
        campaignName: mockCampaign.name,
        totalMatchingUsers: 1,
        messagesSent: 1,
        messagesDelivered: 1, // Math.round(1 * 0.95) = 1
        messagesOpened: 1, // Math.round(1 * 0.7) = 1
      });
      expect(campaignRepository.findById).toHaveBeenCalledWith('test-campaign-id');
      expect(userService.findMatchingUsers).toHaveBeenCalledWith({
        ageRange: mockCampaign.targetAudience.ageRange,
        countries: mockCampaign.targetAudience.countries,
      });
    });

    it('should throw NotFoundException when campaign is not found', async () => {
      campaignRepository.findById.mockResolvedValue(null);

      await expect(service.getStats('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('sendCampaign', () => {
    it('should send campaign to matching users and queue notifications', async () => {
      const matchingUsers = [mockUser];
      campaignRepository.findById.mockResolvedValue(mockCampaign);
      userService.findMatchingUsers.mockResolvedValue(matchingUsers);
      messagingService.sendCampaignMessages.mockResolvedValue(1);

      const result = await service.sendCampaign('test-campaign-id');

      expect(result).toEqual({
        status: 'processing',
        campaignId: mockCampaign.id,
        campaignName: mockCampaign.name,
        messagesSent: 1,
      });
      expect(campaignRepository.findById).toHaveBeenCalledWith('test-campaign-id');
      expect(userService.findMatchingUsers).toHaveBeenCalledWith({
        ageRange: mockCampaign.targetAudience.ageRange,
        countries: mockCampaign.targetAudience.countries,
      });
      expect(messagingService.sendCampaignMessages).toHaveBeenCalledWith(
        mockCampaign,
        matchingUsers,
      );

      // Check that campaign notifications were queued for each user
      expect(emailQueueService.queueCampaignNotification).toHaveBeenCalledWith({
        campaignId: mockCampaign.id,
        campaignName: mockCampaign.name,
        userEmail: mockUser.email,
        userName: mockUser.name,
        messageTemplate: mockCampaign.messageTemplate,
        userCountry: mockUser.country,
      }, 5);

      // Check that completion notification was queued
      expect(emailQueueService.queueStatusNotification).toHaveBeenCalledWith({
        email: 'admin@campaignhub.com',
        campaignName: mockCampaign.name,
        status: 'completed',
        statistics: {
          totalUsers: 1,
          messagesSent: 1,
          messagesDelivered: 1,
          messagesOpened: 1,
        }
      }, 10);
    });

    it('should throw NotFoundException when campaign is not found', async () => {
      campaignRepository.findById.mockResolvedValue(null);

      await expect(service.sendCampaign('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
}); 