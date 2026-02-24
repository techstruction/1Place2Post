import { Module } from '@nestjs/common';
import { PublishQueueService } from './publish-queue.service';
import { PublishWorkerService } from './publish-worker.service';
import { PublishQueueController } from './publish-queue.controller';
import { NotificationModule } from '../notification/notification.module';
import { OutgoingWebhookModule } from '../outgoing-webhook/outgoing-webhook.module';

@Module({
    imports: [NotificationModule, OutgoingWebhookModule],
    controllers: [PublishQueueController],
    providers: [PublishQueueService, PublishWorkerService],
    exports: [PublishQueueService],
})
export class PublishQueueModule { }
