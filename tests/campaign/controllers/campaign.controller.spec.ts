import { Test, TestingModule } from '@nestjs/testing';
import { CampaignController } from '../../../src/campaign/controllers/campaign.controller';
import { NotFoundException } from '@nestjs/common';
import { Campaign } from '../../../src/campaign/entities/campaign.entity';
import { CreateCampaignDto } from '../../../src/campaign/dto/create-campaign.dto';
import { UpdateCampaignDto } from '../../../src/campaign/dto/update-campaign.dto';
import { CampaignStatsDto } from '../../../src/campaign/dto/campaign-stats.dto';

describe('CampaignController', () => {
  let controller: CampaignController;
  let mockCampaignService: any;

  const mockCampaign: Campaign = {
    id: 'test-id',
    name: 'Test Campaign',
    targetAudience: {
      ageRange: { min: 18, max: 65 },
      countries: ['US', 'CA'],
    },
    messageTemplate: 'Hello {name}',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockCampaignService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getStats: jest.fn(),
      sendCampaign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignController],
      providers: [
        {
          provide: 'ICampaignService',
          useValue: mockCampaignService,
        },
      ],
    }).compile();

    controller = module.get<CampaignController>(CampaignController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of campaigns', async () => {
      const expected = [mockCampaign];
      mockCampaignService.findAll.mockResolvedValue(expected);

      expect(await controller.findAll()).toBe(expected);
      expect(mockCampaignService.findAll).toHaveBeenCalled();
    });

    it('should handle empty array', async () => {
      mockCampaignService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();
      expect(result).toEqual([]);
      expect(mockCampaignService.findAll).toHaveBeenCalled();
    });

    it('should propagate errors', async () => {
      const error = new Error('Database error');
      mockCampaignService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(error);
    });
  });

  describe('findById', () => {
    it('should return a single campaign', async () => {
      mockCampaignService.findById.mockResolvedValue(mockCampaign);

      expect(await controller.findById('test-id')).toBe(mockCampaign);
      expect(mockCampaignService.findById).toHaveBeenCalledWith('test-id');
    });

    it('should handle not found campaign', async () => {
      mockCampaignService.findById.mockRejectedValue(new NotFoundException());

      await expect(controller.findById('non-existent')).rejects.toThrow(NotFoundException);
      expect(mockCampaignService.findById).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('create', () => {
    it('should create a campaign', async () => {
      const createDto: CreateCampaignDto = {
        name: 'New Campaign',
        targetAudience: {
          ageRange: { min: 20, max: 40 },
          countries: ['US'],
        },
        messageTemplate: 'Hello {name}',
      };

      mockCampaignService.create.mockResolvedValue({
        ...createDto,
        id: 'new-id',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await controller.create(createDto);

      expect(result.name).toBe(createDto.name);
      expect(mockCampaignService.create).toHaveBeenCalledWith(createDto);
    });

    it('should handle validation errors', async () => {
      const invalidDto = {
        // Missing required fields
      };

      // In a real test, validation would happen at the controller level
      // Here we simulate a validation error from the service
      mockCampaignService.create.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.create(invalidDto as any)).rejects.toThrow('Validation failed');
    });
  });

  describe('update', () => {
    it('should update a campaign', async () => {
      const updateDto: UpdateCampaignDto = {
        name: 'Updated Campaign',
      };

      const updatedCampaign = {
        ...mockCampaign,
        name: 'Updated Campaign',
      };

      mockCampaignService.update.mockResolvedValue(updatedCampaign);

      expect(await controller.update('test-id', updateDto)).toBe(updatedCampaign);
      expect(mockCampaignService.update).toHaveBeenCalledWith('test-id', updateDto);
    });

    it('should handle not found campaign', async () => {
      mockCampaignService.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update('non-existent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a campaign', async () => {
      mockCampaignService.delete.mockResolvedValue(undefined);

      await expect(controller.delete('test-id')).resolves.toBeUndefined();
      expect(mockCampaignService.delete).toHaveBeenCalledWith('test-id');
    });

    it('should handle not found campaign', async () => {
      mockCampaignService.delete.mockRejectedValue(new NotFoundException());

      await expect(controller.delete('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return campaign statistics', async () => {
      const stats: CampaignStatsDto = {
        campaignId: 'test-id',
        campaignName: 'Test Campaign',
        totalMatchingUsers: 100,
        messagesSent: 100,
        messagesDelivered: 95,
        messagesOpened: 70,
      };

      mockCampaignService.getStats.mockResolvedValue(stats);

      expect(await controller.getStats('test-id')).toBe(stats);
      expect(mockCampaignService.getStats).toHaveBeenCalledWith('test-id');
    });

    it('should handle not found campaign', async () => {
      mockCampaignService.getStats.mockRejectedValue(new NotFoundException());

      await expect(controller.getStats('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendCampaign', () => {
    it('should send a campaign', async () => {
      const sendResult = {
        status: 'processing',
        campaignId: 'test-id',
        campaignName: 'Test Campaign',
        messagesSent: 100,
      };

      mockCampaignService.sendCampaign.mockResolvedValue(sendResult);

      expect(await controller.sendCampaign('test-id')).toBe(sendResult);
      expect(mockCampaignService.sendCampaign).toHaveBeenCalledWith('test-id');
    });

    it('should handle not found campaign', async () => {
      mockCampaignService.sendCampaign.mockRejectedValue(new NotFoundException());

      await expect(controller.sendCampaign('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should handle zero matching users', async () => {
      const sendResult = {
        status: 'processing',
        campaignId: 'test-id',
        campaignName: 'Test Campaign',
        messagesSent: 0,
      };

      mockCampaignService.sendCampaign.mockResolvedValue(sendResult);

      const result = await controller.sendCampaign('test-id');
      expect(result.messagesSent).toBe(0);
    });
  });
});