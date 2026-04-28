import { Controller, Get, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { TwitterService } from './twitter.service';
import type { Request, Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('social/twitter')
export class TwitterController {
    constructor(private readonly twitterService: TwitterService) { }

    @UseGuards(JwtAuthGuard)
    @Get('auth')
    async connect(@Req() req: any, @Query('workspaceId') workspaceId: string, @Res() res: ExpressResponse) {
        const userId = req.user?.id;
        if (!userId || !workspaceId) {
            throw new UnauthorizedException('User not found in request');
        }

        const authUrl = this.twitterService.getAuthUrl(userId, workspaceId);
        return res.redirect(authUrl);
    }

    @Get('callback')
    async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: ExpressResponse) {
        if (!code || !state) {
            return res.redirect('/dashboard/settings?error=twitter_auth_failed');
        }

        try {
            await this.twitterService.handleCallback(code, state);
            return res.redirect('/dashboard/settings?success=twitter_connected');
        } catch (error) {
            return res.redirect('/dashboard/settings?error=twitter_auth_failed');
        }
    }
}
