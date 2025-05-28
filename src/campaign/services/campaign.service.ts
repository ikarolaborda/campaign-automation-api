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
    
    // Queue notification for campaign creation
    if (campaign.isActive) {
      await this.emailQueueService.queueStatusNotification({
        email: 'admin@campaignhub.com', // You might want to get this from campaign owner
        campaignName: campaign.name,
        status: 'activated',
      }, 10); // High priority for status notifications
    }
    
    return campaign;
  }

  async update(id: string, updateCampaignDto: UpdateCampaignDto): Promise<Campaign> {
    // Get the original campaign to compare status changes
    const originalCampaign = await this.findById(id);
    const updatedCampaign = await this.campaignRepository.update(id, updateCampaignDto);
    
    // Send status notification if isActive changed
    if ('isActive' in updateCampaignDto && updateCampaignDto.isActive !== originalCampaign.isActive) {
      const stats = await this.getStats(id);
      
      await this.emailQueueService.queueStatusNotification({
        email: 'admin@campaignhub.com', // You might want to get this from campaign owner
        campaignName: updatedCampaign.name,
        status: updateCampaignDto.isActive ? 'activated' : 'paused',
        statistics: {
          totalUsers: stats.totalMatchingUsers,
          messagesSent: stats.messagesSent,
          messagesDelivered: stats.messagesDelivered,
          messagesOpened: stats.messagesOpened,
        }
      }, 10); // High priority for status notifications
    }
    
    return updatedCampaign;
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

    // Queue campaign notifications for all matching users
    for (const user of matchingUsers) {
      await this.emailQueueService.queueCampaignNotification({
        campaignId: campaign.id,
        campaignName: campaign.name,
        userEmail: user.email,
        userName: user.name,
        messageTemplate: campaign.messageTemplate,
        userCountry: user.country,
      }, 5); // Normal priority for campaign notifications
    }

    // Queue completion notification for admin
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
    }, 10); // High priority for completion notifications

    return {
      status: 'processing',
      campaignId: campaign.id,
      campaignName: campaign.name,
      messagesSent,
    };
  }
}