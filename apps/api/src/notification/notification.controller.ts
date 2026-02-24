import { Controller, Get, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
    constructor(private readonly svc: NotificationService) { }

    @Get()
    list(@Request() req, @Query('limit') limit?: string) {
        return this.svc.findAll(req.user.id, limit ? +limit : 50);
    }

    @Get('unread-count')
    unreadCount(@Request() req) { return this.svc.unreadCount(req.user.id); }

    @Patch(':id/read')
    markRead(@Request() req, @Param('id') id: string) { return this.svc.markRead(req.user.id, id); }

    @Patch('read-all')
    markAllRead(@Request() req) { return this.svc.markAllRead(req.user.id); }
}
