import { Controller, Get, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import type { Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('social/facebook')
export class FacebookController {
    constructor(private readonly facebookService: FacebookService) {}

    @UseGuards(JwtAuthGuard)
    @Get('auth')
    connect(@Req() req: any, @Query('workspaceId') workspaceId: string, @Res() res: ExpressResponse) {
        if (!req.user?.id || !workspaceId) throw new UnauthorizedException('userId and workspaceId required');
        return res.redirect(this.facebookService.getAuthUrl(req.user.id, workspaceId));
    }

    @Get('callback')
    async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: ExpressResponse) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        if (!code || !state) return res.redirect(`${frontendUrl}/dashboard/connections?error=facebook_auth_failed`);
        try {
            const result = await this.facebookService.handleCallback(code, state);
            return res.redirect(`${frontendUrl}/dashboard/connections?success=facebook_connected&pages=${result.pagesConnected}`);
        } catch {
            return res.redirect(`${frontendUrl}/dashboard/connections?error=facebook_auth_failed`);
        }
    }
}
