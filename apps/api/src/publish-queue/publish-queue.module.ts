import { Module } from '@nestjs/common';
import { PublishQueueService } from './publish-queue.service';
import { PublishWorkerService } from './publish-worker.service';
import { PublishQueueController } from './publish-queue.controller';
import { NotificationModule } from '../notification/notification.module';
import { OutgoingWebhookModule } from '../outgoing-webhook/outgoing-webhook.module';
import { BullQueueModule } from './bull-queue.module';

@Module({
    imports: [NotificationModule, OutgoingWebhookModule, BullQueueModule],
    controllers: [PublishQueueController],
    providers: [PublishQueueService, PublishWorkerService],
    exports: [PublishQueueService],
})
export class PublishQueueModule { }
