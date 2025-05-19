import { Injectable, Logger } from '@nestjs/common';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { User } from '../../user/entities/user.entity';
import { IMessagingService } from '../contracts/messaging-service.interface';

@Injectable()
export class MessagingService implements IMessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    @Inject('MESSAGING_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  async sendCampaignMessages(campaign: Campaign, users: User[]): Promise<number> {
    this.logger.log(`Sending campaign '${campaign.name}' to ${users.length} users`);
    const chunkSize = 100;
    for (let i = 0; i < users.length; i += chunkSize) {
      const slice = users.slice(i, i + chunkSize);
      await Promise.all(
        slice.map(user =>
          this.client.emit('campaign_message', { campaign, user }).toPromise(),
        ),
      );
    }
    return users.length;
  }

  async processCampaignMessage(data: { campaign: Campaign; user: User }): Promise<void> {
    const { campaign, user } = data;
    const message = this.formatMessage(campaign.messageTemplate, user);
    this.logger.debug(`Formatted message for ${user.email}: ${message}`);
    // simulate async delivery
    await new Promise(res => setTimeout(res, 50));
  }

  private formatMessage(template: string, user: User): string {
    return template
      .replace('{name}', user.name)
      .replace('{email}', user.email)
      .replace('{age}', user.age.toString())
      .replace('{country}', user.country);
  }
}