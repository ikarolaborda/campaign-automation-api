import { Campaign } from '../entities/campaign.entity';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';
import { CampaignStatsDto } from '../dto/campaign-stats.dto';

export interface ICampaignService {
  findAll(): Promise<Campaign[]>;
  findById(id: string): Promise<Campaign>;
  create(createCampaignDto: CreateCampaignDto): Promise<Campaign>;
  update(id: string, updateCampaignDto: UpdateCampaignDto): Promise<Campaign>;
  delete(id: string): Promise<void>;
  getStats(id: string): Promise<CampaignStatsDto>;
  sendCampaign(id: string): Promise<{ status: string; campaignId: string; campaignName: string; messagesSent: number }>;
}