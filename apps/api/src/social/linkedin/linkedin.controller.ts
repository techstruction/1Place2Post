import { Controller, Get, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { LinkedinService } from './linkedin.service';
import type { Request, Response as ExpressResponse } from 'express';
// Using the same path relative to where auth guards are as in InstagramController
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('social/linkedin')
export class LinkedinController {
    constructor(private readonly linkedinService: LinkedinService) { }

    @UseGuards(JwtAuthGuard)
    @Get('auth')
    async connect(@Req() req: any, @Res() res: ExpressResponse) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not found in request');
        }

        const authUrl = this.linkedinService.getAuthUrl(userId);
        return res.redirect(authUrl);
    }

    @Get('callback')
    async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: ExpressResponse) {
        if (!code || !state) {
            return res.redirect('/dashboard/settings?error=linkedin_auth_failed');
        }

        try {
            await this.linkedinService.handleCallback(code, state);
            return res.redirect('/dashboard/settings?success=linkedin_connected');
        } catch (error) {
            return res.redirect('/dashboard/settings?error=linkedin_auth_failed');
        }
    }
}
