import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OutgoingWebhookService, CreateOutgoingWebhookDto } from './outgoing-webhook.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('outgoing-webhooks')
@UseGuards(JwtAuthGuard)
export class OutgoingWebhookController {
    constructor(private readonly svc: OutgoingWebhookService) { }

    @Post() create(@Request() req, @Body() dto: CreateOutgoingWebhookDto) { return this.svc.create(req.user.id, dto); }
    @Get() findAll(@Request() req) { return this.svc.findAll(req.user.id); }
    @Patch(':id') update(@Request() req, @Param('id') id: string, @Body() dto: any) { return this.svc.update(req.user.id, id, dto); }
    @Delete(':id') remove(@Request() req, @Param('id') id: string) { return this.svc.remove(req.user.id, id); }
}
