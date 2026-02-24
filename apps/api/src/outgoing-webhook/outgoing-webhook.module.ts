import { Module } from '@nestjs/common';
import { OutgoingWebhookService } from './outgoing-webhook.service';
import { OutgoingWebhookController } from './outgoing-webhook.controller';

@Module({ controllers: [OutgoingWebhookController], providers: [OutgoingWebhookService], exports: [OutgoingWebhookService] })
export class OutgoingWebhookModule { }
