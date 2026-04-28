import { Controller, Get, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import type { Request, Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // Assuming you have standard JWT auth guard

@Controller('social/instagram')
export class InstagramController {
    constructor(private readonly instagramService: InstagramService) { }

    @UseGuards(JwtAuthGuard)
    @Get('auth')
    async connect(@Req() req: any, @Query('workspaceId') workspaceId: string, @Res() res: ExpressResponse) {
        // JWT guard ensures req.user exists
        const userId = req.user?.id;
        if (!userId || !workspaceId) {
            throw new UnauthorizedException('User not found in request');
        }

        const authUrl = this.instagramService.getAuthUrl(userId, workspaceId);
        return res.redirect(authUrl);
    }

    @Get('callback')
    async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: ExpressResponse) {
        if (!code || !state) {
            return res.redirect('/dashboard/settings?error=instagram_auth_failed');
        }

        try {
            await this.instagramService.handleCallback(code, state);
            // Redirect back to the frontend settings page
            return res.redirect('/dashboard/settings?success=instagram_connected');
        } catch (error) {
            return res.redirect('/dashboard/settings?error=instagram_auth_failed');
        }
    }
}
