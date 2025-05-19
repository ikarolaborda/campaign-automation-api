import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MessagingService } from './services/messaging.service';
import { MessageConsumer } from './consumers/message.consumer';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([{
      name: 'MESSAGING_SERVICE',
      imports: [ConfigModule],
      useFactory: (cs: ConfigService) => {
        const url = cs.get<string>('RABBITMQ_URL');
        const queue = cs.get<string>('RABBITMQ_QUEUE');
        if (!url || !queue) {
          throw new Error('Missing RABBITMQ_URL or RABBITMQ_QUEUE');
        }
        return {
          transport: Transport.RMQ,
          options: {
            urls: [url],
            queue,
            queueOptions: { durable: true },
          },
        };
      },
      inject: [ConfigService],
    }]),
  ],
  providers: [
    {
      provide: 'IMessagingService',
      useClass: MessagingService,
    },
    MessageConsumer,
  ],
  exports: ['IMessagingService'],
})
export class MessagingModule {}