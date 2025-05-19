import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignController } from './controllers/campaign.controller';
import { CampaignService } from './services/campaign.service';
import { CampaignRepository } from './repositories/campaign.repository';
import { UserModule } from '../user/user.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign]),
    UserModule,
    MessagingModule,
  ],
  controllers: [CampaignController],
  providers: [
    {
      provide: 'ICampaignRepository',
      useClass: CampaignRepository,
    },
    {
      provide: 'ICampaignService',
      useClass: CampaignService,
    },
  ],
  exports: ['ICampaignService'],
})
export class CampaignModule {}