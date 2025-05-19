import { Campaign } from '../entities/campaign.entity';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';

export interface ICampaignRepository {
  findAll(): Promise<Campaign[]>;
  findById(id: string): Promise<Campaign>;
  create(createCampaignDto: CreateCampaignDto): Promise<Campaign>;
  update(id: string, updateCampaignDto: UpdateCampaignDto): Promise<Campaign>;
  delete(id: string): Promise<void>;
}