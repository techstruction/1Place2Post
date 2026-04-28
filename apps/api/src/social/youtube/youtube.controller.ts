import { Controller, Get, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { YoutubeService } from './youtube.service';
import type { Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('social/youtube')
export class YoutubeController {
    constructor(private readonly youtubeService: YoutubeService) {}

    @UseGuards(JwtAuthGuard)
    @Get('auth')
    connect(@Req() req: any, @Query('workspaceId') workspaceId: string, @Res() res: ExpressResponse) {
        if (!req.user?.id || !workspaceId) throw new UnauthorizedException();
        return res.redirect(this.youtubeService.getAuthUrl(req.user.id, workspaceId));
    }

    @Get('callback')
    async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: ExpressResponse) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        if (!code || !state) return res.redirect(`${frontendUrl}/dashboard/connections?error=youtube_auth_failed`);
        try {
            await this.youtubeService.handleCallback(code, state);
            return res.redirect(`${frontendUrl}/dashboard/connections?success=youtube_connected`);
        } catch {
            return res.redirect(`${frontendUrl}/dashboard/connections?error=youtube_auth_failed`);
        }
    }
}
