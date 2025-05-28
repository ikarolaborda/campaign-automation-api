import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { EmailService } from './email.service';
import { EmailQueueService } from '../queue/email-queue.service';

export class TestEmailDto {
  @ApiProperty({ 
    example: 'user@example.com', 
    description: 'Recipient email address' 
  })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ 
    example: 'Test Email Subject', 
    description: 'Email subject line' 
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ 
    example: 'This is a test email message.', 
    description: 'Email message content' 
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class TestCampaignNotificationDto {
  @ApiProperty({ 
    example: 'campaign-123', 
    description: 'Campaign ID' 
  })
  @IsString()
  @IsNotEmpty()
  campaignId: string;

  @ApiProperty({ 
    example: 'Summer Sale Campaign', 
    description: 'Campaign name' 
  })
  @IsString()
  @IsNotEmpty()
  campaignName: string;

  @ApiProperty({ 
    example: 'user@example.com', 
    description: 'User email address' 
  })
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;

  @ApiProperty({ 
    example: 'John Doe', 
    description: 'User full name' 
  })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({ 
    example: 'Hello {name}! Check out our special offer for {country} customers!', 
    description: 'Message template with placeholders' 
  })
  @IsString()
  @IsNotEmpty()
  messageTemplate: string;

  @ApiProperty({ 
    example: 'US', 
    description: 'User country code' 
  })
  @IsString()
  @IsNotEmpty()
  userCountry: string;
}

@ApiTags('email')
@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  @Post('test')
  @ApiOperation({ summary: 'Send a test email directly' })
  @ApiBody({ type: TestEmailDto })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 500, description: 'Failed to send email' })
  async sendTestEmail(@Body() testEmailDto: TestEmailDto): Promise<{ success: boolean; message: string }> {
    const success = await this.emailService.sendEmail({
      to: testEmailDto.to,
      subject: testEmailDto.subject,
      text: testEmailDto.message,
      html: `<p>${testEmailDto.message}</p>`,
    });

    return {
      success,
      message: success ? 'Email sent successfully' : 'Failed to send email',
    };
  }

  @Post('test-queue')
  @ApiOperation({ summary: 'Queue a test campaign notification' })
  @ApiBody({ type: TestCampaignNotificationDto })
  @ApiResponse({ status: 200, description: 'Email queued successfully' })
  @ApiResponse({ status: 500, description: 'Failed to queue email' })
  async queueTestCampaignNotification(
    @Body() testDto: TestCampaignNotificationDto
  ): Promise<{ success: boolean; message: string }> {
    const success = await this.emailQueueService.queueCampaignNotification({
      campaignId: testDto.campaignId,
      campaignName: testDto.campaignName,
      userEmail: testDto.userEmail,
      userName: testDto.userName,
      messageTemplate: testDto.messageTemplate,
      userCountry: testDto.userCountry,
    });

    return {
      success,
      message: success ? 'Email queued successfully' : 'Failed to queue email',
    };
  }

  @Post('test-status')
  @ApiOperation({ summary: 'Queue a test status notification' })
  @ApiResponse({ status: 200, description: 'Status notification queued successfully' })
  @ApiResponse({ 
    status: 200, 
    description: 'Status notification queued successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Status notification queued successfully' }
      }
    }
  })
  async queueTestStatusNotification(): Promise<{ success: boolean; message: string }> {
    const success = await this.emailQueueService.queueStatusNotification({
      email: 'admin@campaignhub.com',
      campaignName: 'Test Campaign',
      status: 'activated',
      statistics: {
        totalUsers: 100,
        messagesSent: 95,
        messagesDelivered: 90,
        messagesOpened: 70,
      }
    });

    return {
      success,
      message: success ? 'Status notification queued successfully' : 'Failed to queue status notification',
    };
  }

  @Get('queue-status')
  @ApiOperation({ summary: 'Get email queue status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Queue status retrieved',
    schema: {
      type: 'object',
      properties: {
        messageCount: { type: 'number', example: 5 },
        consumerCount: { type: 'number', example: 1 }
      }
    }
  })
  async getQueueStatus(): Promise<{ messageCount: number; consumerCount: number }> {
    return this.emailQueueService.getQueueStatus();
  }
} 