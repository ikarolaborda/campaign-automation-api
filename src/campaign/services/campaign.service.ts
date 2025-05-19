import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Campaign } from '../entities/campaign.entity';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';
import { CampaignStatsDto } from '../dto/campaign-stats.dto';
import { ICampaignService } from '../contracts/campaign-service.interface';
import { ICampaignRepository } from '../contracts/campaign-repository.interface';
import { IUserService } from '../../user/contracts/user-service.interface';
import { IMessagingService } from '../../messaging/contracts/messaging-service.interface';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class CampaignService implements ICampaignService {
  constructor(
    @Inject('ICampaignRepository')
    private readonly campaignRepository: ICampaignRepository,
    @Inject('IUserService')
    private readonly userService: IUserService,
    @Inject('IMessagingService')
    private readonly messagingService: IMessagingService,
  ) {}

  async findAll(): Promise<Campaign[]> {
    return this.campaignRepository.findAll();
  }

  async findById(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    return campaign;
  }

  async create(createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    return this.campaignRepository.create(createCampaignDto);
  }

  async update(id: string, updateCampaignDto: UpdateCampaignDto): Promise<Campaign> {
    // Ensure campaign exists
    await this.findById(id);
    return this.campaignRepository.update(id, updateCampaignDto);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.campaignRepository.delete(id);
  }

  async getStats(id: string): Promise<CampaignStatsDto> {
    const campaign = await this.findById(id);

    const matchingUsers = await this.userService.findMatchingUsers({
      ageRange: campaign.targetAudience.ageRange,
      countries: campaign.targetAudience.countries,
    });

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      totalMatchingUsers: matchingUsers.length,
      messagesSent: matchingUsers.length,
      messagesDelivered: Math.round(matchingUsers.length * 0.95), // 95% delivery rate
      messagesOpened: Math.round(matchingUsers.length * 0.7),    // 70% open rate
    };
  }

  async sendCampaign(id: string): Promise<{
    status: string;
    campaignId: string;
    campaignName: string;
    messagesSent: number
  }> {
    const campaign = await this.findById(id);

    const matchingUsers = await this.userService.findMatchingUsers({
      ageRange: campaign.targetAudience.ageRange,
      countries: campaign.targetAudience.countries,
    });

    const messagesSent = await this.messagingService.sendCampaignMessages(
      campaign,
      matchingUsers,
    );

    return {
      status: 'processing',
      campaignId: campaign.id,
      campaignName: campaign.name,
      messagesSent,
    };
  }
}