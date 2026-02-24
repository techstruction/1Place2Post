import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RssCampaignService } from './rss-campaign.service';
import { CreateRssCampaignDto } from './dto/create-rss-campaign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rss-campaigns')
@UseGuards(JwtAuthGuard)
export class RssCampaignController {
    constructor(private readonly svc: RssCampaignService) { }

    @Post() create(@Request() req, @Body() dto: CreateRssCampaignDto) { return this.svc.create(req.user.id, dto); }
    @Get() findAll(@Request() req) { return this.svc.findAll(req.user.id); }
    @Patch(':id') update(@Request() req, @Param('id') id: string, @Body() dto: any) { return this.svc.update(req.user.id, id, dto); }
    @Delete(':id') remove(@Request() req, @Param('id') id: string) { return this.svc.remove(req.user.id, id); }
}
