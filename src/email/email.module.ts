import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailQueueService } from '../queue/email-queue.service';
import { EmailController } from './email.controller';

@Module({
  controllers: [EmailController],
  providers: [EmailService, EmailQueueService],
  exports: [EmailService, EmailQueueService],
})
export class EmailModule {} 