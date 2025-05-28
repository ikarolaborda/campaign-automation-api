import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EmailService } from '../email/email.service';
import { EmailQueueService } from '../queue/email-queue.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check application health' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  @ApiResponse({ status: 503, description: 'Application is unhealthy' })
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  @ApiOperation({ summary: 'Check database connectivity' })
  @ApiResponse({ status: 200, description: 'Database is connected' })
  @ApiResponse({ status: 503, description: 'Database is disconnected' })
  async getDatabaseHealth(): Promise<{ status: string; database: string }> {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
      };
    }
  }

  @Get('email')
  @ApiOperation({ summary: 'Check email service connectivity' })
  @ApiResponse({ status: 200, description: 'Email service is available' })
  @ApiResponse({ status: 503, description: 'Email service is unavailable' })
  async getEmailHealth(): Promise<{ status: string; email: string }> {
    try {
      const isConnected = await this.emailService.testConnection();
      return {
        status: isConnected ? 'ok' : 'error',
        email: isConnected ? 'connected' : 'disconnected',
      };
    } catch (error) {
      return {
        status: 'error',
        email: 'disconnected',
      };
    }
  }

  @Get('queue')
  @ApiOperation({ summary: 'Check email queue status' })
  @ApiResponse({ status: 200, description: 'Queue status retrieved' })
  @ApiResponse({ status: 503, description: 'Queue is unavailable' })
  async getQueueHealth(): Promise<{ 
    status: string; 
    queue: { messageCount: number; consumerCount: number } 
  }> {
    try {
      const queueStatus = await this.emailQueueService.getQueueStatus();
      return {
        status: queueStatus.messageCount >= 0 ? 'ok' : 'error',
        queue: queueStatus,
      };
    } catch (error) {
      return {
        status: 'error',
        queue: { messageCount: -1, consumerCount: -1 },
      };
    }
  }

  @Get('full')
  @ApiOperation({ summary: 'Check full system health' })
  @ApiResponse({ status: 200, description: 'Full system health status' })
  async getFullHealth(): Promise<{
    status: string;
    timestamp: string;
    services: {
      database: string;
      email: string;
      queue: { messageCount: number; consumerCount: number };
    }
  }> {
    const [dbHealth, emailHealth, queueHealth] = await Promise.all([
      this.getDatabaseHealth(),
      this.getEmailHealth(),
      this.getQueueHealth(),
    ]);

    const allHealthy = 
      dbHealth.status === 'ok' && 
      emailHealth.status === 'ok' && 
      queueHealth.status === 'ok';

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth.database,
        email: emailHealth.email,
        queue: queueHealth.queue,
      },
    };
  }
} 