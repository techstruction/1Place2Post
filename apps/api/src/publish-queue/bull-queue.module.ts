import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const PLATFORM_QUEUES = [
  'publish-instagram',
  'publish-twitter',
  'publish-linkedin',
  'publish-tiktok',
  'publish-youtube',
  'publish-facebook',
  'media-processing',
  'notification',
] as const;

export type PlatformQueueName = typeof PLATFORM_QUEUES[number];

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL') || 'redis://localhost:6379',
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      ...PLATFORM_QUEUES.map(name => ({ name })),
    ),
  ],
  exports: [BullModule],
})
export class BullQueueModule {}
