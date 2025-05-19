import { Injectable, Inject } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { IMessagingService } from '../contracts/messaging-service.interface';

@Injectable()
export class MessageConsumer {
  constructor(
    @Inject('IMessagingService')
    private readonly messagingService: IMessagingService,
  ) {}

  @MessagePattern('campaign_message')
  async handleCampaignMessage(@Payload() data: any, @Ctx() context: RmqContext): Promise<void> {
    try {
      await this.messagingService.processCampaignMessage(data);
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    } catch (error) {
      console.error('Error processing message:', error);
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg);
    }
  }
}