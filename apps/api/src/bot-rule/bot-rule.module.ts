import { Module } from '@nestjs/common';
import { BotRuleService } from './bot-rule.service';
import { BotRuleController, WebhookController } from './bot-rule.controller';

@Module({
    controllers: [BotRuleController, WebhookController],
    providers: [BotRuleService],
})
export class BotRuleModule { }
