import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';
import { EmailService, CampaignEmailData } from '../email/email.service';

export interface EmailJob {
  type: 'campaign_notification' | 'status_notification';
  data: CampaignEmailData | StatusNotificationData;
  priority?: number;
  delay?: number;
}

export interface StatusNotificationData {
  email: string;
  campaignName: string;
  status: 'activated' | 'paused' | 'completed' | 'created' | 'deleted';
  statistics?: {
    totalUsers: number;
    messagesSent: number;
    messagesDelivered: number;
    messagesOpened: number;
  };
}

@Injectable()
export class EmailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailQueueService.name);
  private connection: Connection;
  private channel: Channel;
  private readonly queueName = 'email_notifications';
  private readonly exchangeName = 'campaign_exchange';

  constructor(private readonly emailService: EmailService) {}

  async onModuleInit() {
    try {
      await this.connect();
      await this.setupQueue();
      await this.startConsumer();
    } catch (error) {
      this.logger.error('Failed to initialize EmailQueueService, will retry later', error);
      // Don't throw the error to prevent module initialization failure
      // The service will attempt to reconnect when methods are called
    }
  }

  async onModuleDestroy() {
    try {
      await this.disconnect();
    } catch (error) {
      this.logger.error('Error during EmailQueueService cleanup', error);
    }
  }

  private async connect(): Promise<void> {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      
      this.logger.log('Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  private async setupQueue(): Promise<void> {
    try {
      // Declare exchange
      await this.channel.assertExchange(this.exchangeName, 'direct', { durable: true });

      // Declare queue with options for reliability
      await this.channel.assertQueue(this.queueName, {
        durable: true, // Queue survives broker restarts
        arguments: {
          'x-message-ttl': 24 * 60 * 60 * 1000, // 24 hours TTL
          'x-max-retries': 3, // Maximum retry attempts
        }
      });

      // Bind queue to exchange
      await this.channel.bindQueue(this.queueName, this.exchangeName, 'email');

      // Set prefetch to process one message at a time
      await this.channel.prefetch(1);

      this.logger.log('Email queue setup completed');
    } catch (error) {
      this.logger.error('Failed to setup email queue', error);
      throw error;
    }
  }

  private async ensureConnection(): Promise<boolean> {
    if (!this.connection || !this.channel) {
      try {
        await this.connect();
        await this.setupQueue();
        await this.startConsumer();
        return true;
      } catch (error) {
        this.logger.error('Failed to establish connection', error);
        return false;
      }
    }
    return true;
  }

  async addEmailJob(job: EmailJob): Promise<boolean> {
    try {
      // Ensure connection before attempting to publish
      if (!(await this.ensureConnection())) {
        this.logger.error('Cannot add email job - no connection to RabbitMQ');
        return false;
      }

      const message = Buffer.from(JSON.stringify(job));
      const options: any = {
        persistent: true, // Message survives broker restarts
        timestamp: Date.now(),
      };

      // Add priority if specified
      if (job.priority) {
        options.priority = job.priority;
      }

      // Add delay if specified
      if (job.delay && job.delay > 0) {
        options.headers = {
          'x-delay': job.delay
        };
      }

      const published = this.channel.publish(
        this.exchangeName,
        'email',
        message,
        options
      );

      if (published) {
        this.logger.log(`Email job queued: ${job.type}`);
        return true;
      } else {
        this.logger.warn('Failed to queue email job - channel buffer full');
        return false;
      }
    } catch (error) {
      this.logger.error('Failed to add email job to queue', error);
      return false;
    }
  }

  private async startConsumer(): Promise<void> {
    try {
      await this.channel.consume(this.queueName, async (message) => {
        if (!message) return;

        try {
          const job: EmailJob = JSON.parse(message.content.toString());
          this.logger.log(`Processing email job: ${job.type}`);

          let success = false;

          switch (job.type) {
            case 'campaign_notification':
              success = await this.emailService.sendCampaignNotification(job.data as CampaignEmailData);
              break;
            case 'status_notification':
              const statusData = job.data as StatusNotificationData;
              success = await this.emailService.sendCampaignStatusNotification(
                statusData.email,
                statusData.campaignName,
                statusData.status,
                statusData.statistics
              );
              break;
            default:
              this.logger.warn(`Unknown email job type: ${job.type}`);
              success = false;
          }

          if (success) {
            // Acknowledge the message
            this.channel.ack(message);
            this.logger.log(`Email job completed: ${job.type}`);
          } else {
            // Reject and requeue the message (with retry logic)
            const retryCount = message.properties.headers['x-retry-count'] || 0;
            const maxRetries = 3;

            if (retryCount < maxRetries) {
              // Add retry count and requeue
              const retryJob = {
                ...job,
                retryCount: retryCount + 1
              };

              setTimeout(() => {
                this.addEmailJob(retryJob);
              }, Math.pow(2, retryCount) * 1000); // Exponential backoff

              this.channel.ack(message);
              this.logger.log(`Email job failed, retrying (${retryCount + 1}/${maxRetries}): ${job.type}`);
            } else {
              // Max retries reached, reject without requeue
              this.channel.reject(message, false);
              this.logger.error(`Email job failed after ${maxRetries} retries: ${job.type}`);
            }
          }
        } catch (error) {
          this.logger.error('Error processing email job', error);
          // Reject and don't requeue on parsing errors
          this.channel.reject(message, false);
        }
      }, { noAck: false });

      this.logger.log('Email queue consumer started');
    } catch (error) {
      this.logger.error('Failed to start email queue consumer', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
    }
  }

  // Convenience methods for common email types
  async queueCampaignNotification(data: CampaignEmailData, priority = 5): Promise<boolean> {
    return this.addEmailJob({
      type: 'campaign_notification',
      data,
      priority
    });
  }

  async queueStatusNotification(data: StatusNotificationData, priority = 10): Promise<boolean> {
    return this.addEmailJob({
      type: 'status_notification',
      data,
      priority
    });
  }

  // Queue health check
  async getQueueStatus(): Promise<{ messageCount: number; consumerCount: number }> {
    try {
      // Ensure connection before checking queue status
      if (!(await this.ensureConnection())) {
        this.logger.error('Cannot get queue status - no connection to RabbitMQ');
        return { messageCount: -1, consumerCount: -1 };
      }

      const queueInfo = await this.channel.checkQueue(this.queueName);
      return {
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount
      };
    } catch (error) {
      this.logger.error('Failed to get queue status', error);
      return { messageCount: -1, consumerCount: -1 };
    }
  }
} 