import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Headers, UnauthorizedException } from '@nestjs/common';
import { BotRuleService } from './bot-rule.service';
import { CreateBotRuleDto } from './dto/create-bot-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bot-rules')
@UseGuards(JwtAuthGuard)
export class BotRuleController {
    constructor(private readonly service: BotRuleService) { }

    @Post() create(@Request() req, @Body() dto: CreateBotRuleDto) { return this.service.create(req.user.id, dto); }
    @Get() findAll(@Request() req) { return this.service.findAll(req.user.id); }
    @Patch(':id') update(@Request() req, @Param('id') id: string, @Body() dto: Partial<CreateBotRuleDto>) { return this.service.update(req.user.id, id, dto); }
    @Delete(':id') remove(@Request() req, @Param('id') id: string) { return this.service.remove(req.user.id, id); }
}

// ── Webhook ingest (INCOMING_WEBHOOK_SECRET protected) ───────────────────
@Controller('webhooks')
export class WebhookController {
    constructor(private readonly botRuleService: BotRuleService) { }

    @Post('ingest')
    async ingest(
        @Headers('x-1p2p-secret') secret: string,
        @Body() body: { type: string; userId: string; platform: string; data: { message?: string; fromHandle?: string } },
    ) {
        if (secret !== process.env.INCOMING_WEBHOOK_SECRET) {
            throw new UnauthorizedException('Invalid webhook secret');
        }

        if (body.type === 'inbox' && body.data?.message && body.userId) {
            return this.botRuleService.processIngest(body.userId, body.data.message, body.platform);
        }

        return { received: true };
    }
}
