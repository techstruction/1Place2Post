import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RecordEventDto } from './dto/record-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
    constructor(private readonly svc: AnalyticsService) { }

    @Post('events') record(@Request() req, @Body() dto: RecordEventDto) { return this.svc.record(req.user.id, dto); }
    @Get('summary') summary(@Request() req) { return this.svc.summary(req.user.id); }
    @Get('timeline') timeline(@Request() req, @Query('days') days?: string) {
        return this.svc.timeline(req.user.id, days ? parseInt(days, 10) : 30);
    }
}
