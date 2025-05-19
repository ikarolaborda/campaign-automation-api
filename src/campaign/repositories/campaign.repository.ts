import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';
import { ICampaignRepository } from '../contracts/campaign-repository.interface';

@Injectable()
export class CampaignRepository implements ICampaignRepository {
  constructor(
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
  ) {}

  async findAll(): Promise<Campaign[]> {
    return this.campaignRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Campaign> {
    return this.campaignRepository.findOneOrFail({ where: { id } });
  }

  async create(createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    const campaign = this.campaignRepository.create(createCampaignDto);
    return this.campaignRepository.save(campaign);
  }

  async update(id: string, updateCampaignDto: UpdateCampaignDto): Promise<Campaign> {
    await this.campaignRepository.update(id, updateCampaignDto);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.campaignRepository.delete(id);
  }
}