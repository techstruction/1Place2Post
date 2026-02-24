import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { InboxService } from './inbox.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inbox')
@UseGuards(JwtAuthGuard)
export class InboxController {
    constructor(private readonly service: InboxService) { }

    @Get()
    findAll(@Request() req) {
        return this.service.findAll(req.user.id);
    }

    @Get('unread-count')
    getUnreadCount(@Request() req) {
        return this.service.getUnreadCount(req.user.id);
    }

    @Patch(':id/read')
    markRead(@Request() req, @Param('id') id: string) {
        return this.service.markRead(req.user.id, id);
    }

    @Patch('read-all')
    markAllRead(@Request() req) {
        return this.service.markAllRead(req.user.id);
    }
}
