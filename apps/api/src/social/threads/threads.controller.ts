import { Controller, Get, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ThreadsService } from './threads.service';
import type { Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('social/threads')
export class ThreadsController {
    constructor(private readonly threadsService: ThreadsService) {}

    @UseGuards(JwtAuthGuard)
    @Get('auth')
    connect(@Req() req: any, @Query('workspaceId') workspaceId: string, @Res() res: ExpressResponse) {
        if (!req.user?.id || !workspaceId) throw new UnauthorizedException();
        return res.redirect(this.threadsService.getAuthUrl(req.user.id, workspaceId));
    }

    @Get('callback')
    async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: ExpressResponse) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        if (!code || !state) return res.redirect(`${frontendUrl}/dashboard/connections?error=threads_auth_failed`);
        try {
            await this.threadsService.handleCallback(code, state);
            return res.redirect(`${frontendUrl}/dashboard/connections?success=threads_connected`);
        } catch {
            return res.redirect(`${frontendUrl}/dashboard/connections?error=threads_auth_failed`);
        }
    }
}
