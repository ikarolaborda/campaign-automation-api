import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Campaign } from '../entities/campaign.entity';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';
import { CampaignStatsDto } from '../dto/campaign-stats.dto';
import { ICampaignService } from '../contracts/campaign-service.interface';
import { ICampaignRepository } from '../contracts/campaign-repository.interface';
import { IUserService } from '../../user/contracts/user-service.interface';
import { IMessagingService } from '../../messaging/contracts/messaging-service.interface';
import { EmailQueueService } from '../../queue/email-queue.service';
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
    private readonly emailQueueService: EmailQueueService,
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
    const campaign = await this.campaignRepository.create(createCampaignDto);

    await this.emailQueueService.queueStatusNotification({
      email: 'admin@campaignhub.com',
      campaignName: campaign.name,
      status: 'created',
    }, 10);

    if (campaign.isActive) {
      await this.emailQueueService.queueStatusNotification({
        email: 'admin@campaignhub.com',
        campaignName: campaign.name,
        status: 'activated',
      }, 10);
    }
    
    return campaign;
  }

  async update(id: string, updateCampaignDto: UpdateCampaignDto): Promise<Campaign> {
    const originalCampaign = await this.findById(id);
    const updatedCampaign = await this.campaignRepository.update(id, updateCampaignDto);

    if ('isActive' in updateCampaignDto && updateCampaignDto.isActive !== originalCampaign.isActive) {
      const stats = await this.getStats(id);
      
      await this.emailQueueService.queueStatusNotification({
        email: 'admin@campaignhub.com',
        campaignName: updatedCampaign.name,
        status: updateCampaignDto.isActive ? 'activated' : 'paused',
        statistics: {
          totalUsers: stats.totalMatchingUsers,
          messagesSent: stats.messagesSent,
          messagesDelivered: stats.messagesDelivered,
          messagesOpened: stats.messagesOpened,
        }
      }, 10);
    }
    
    return updatedCampaign;
  }

  async delete(id: string): Promise<void> {
    const campaign = await this.findById(id);

    await this.emailQueueService.queueStatusNotification({
      email: 'admin@campaignhub.com',
      campaignName: campaign.name,
      status: 'deleted',
    }, 10);
    
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
      messagesDelivered: Math.round(matchingUsers.length * 0.95),
      messagesOpened: Math.round(matchingUsers.length * 0.7),
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

    for (const user of matchingUsers) {
      await this.emailQueueService.queueCampaignNotification({
        campaignId: campaign.id,
        campaignName: campaign.name,
        userEmail: user.email,
        userName: user.name,
        messageTemplate: campaign.messageTemplate,
        userCountry: user.country,
      }, 5);
    }

    const stats = await this.getStats(id);
    await this.emailQueueService.queueStatusNotification({
      email: 'admin@campaignhub.com',
      campaignName: campaign.name,
      status: 'completed',
      statistics: {
        totalUsers: stats.totalMatchingUsers,
        messagesSent: stats.messagesSent,
        messagesDelivered: stats.messagesDelivered,
        messagesOpened: stats.messagesOpened,
      }
    }, 10);

    return {
      status: 'processing',
      campaignId: campaign.id,
      campaignName: campaign.name,
      messagesSent,
    };
  }
}