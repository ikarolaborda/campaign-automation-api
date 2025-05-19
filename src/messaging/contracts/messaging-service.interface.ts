import { Campaign } from '../../campaign/entities/campaign.entity';
import { User } from '../../user/entities/user.entity';

export interface IMessagingService {
  sendCampaignMessages(campaign: Campaign, users: User[]): Promise<number>;
  processCampaignMessage(data: { campaign: Campaign; user: User }): Promise<void>;
}