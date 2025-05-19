import { ApiProperty } from '@nestjs/swagger';

export class CampaignStatsDto {
  @ApiProperty({ example: 'uuid', description: 'Campaign ID' })
  campaignId: string;

  @ApiProperty({ example: 'Summer Sale Campaign', description: 'Campaign name' })
  campaignName: string;

  @ApiProperty({ example: 1250, description: 'Total number of matching users' })
  totalMatchingUsers: number;

  @ApiProperty({ example: 1250, description: 'Number of messages sent' })
  messagesSent: number;

  @ApiProperty({ example: 1200, description: 'Number of messages delivered' })
  messagesDelivered: number;

  @ApiProperty({ example: 850, description: 'Number of messages opened' })
  messagesOpened: number;
}