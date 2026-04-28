import { Controller, Get, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { TiktokService } from './tiktok.service';
import type { Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('social/tiktok')
export class TiktokController {
    constructor(private readonly tiktokService: TiktokService) {}

    @UseGuards(JwtAuthGuard)
    @Get('auth')
    connect(@Req() req: any, @Query('workspaceId') workspaceId: string, @Res() res: ExpressResponse) {
        if (!req.user?.id || !workspaceId) throw new UnauthorizedException();
        return res.redirect(this.tiktokService.getAuthUrl(req.user.id, workspaceId));
    }

    @Get('callback')
    async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: ExpressResponse) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        if (!code || !state) return res.redirect(`${frontendUrl}/dashboard/connections?error=tiktok_auth_failed`);
        try {
            await this.tiktokService.handleCallback(code, state);
            return res.redirect(`${frontendUrl}/dashboard/connections?success=tiktok_connected`);
        } catch {
            return res.redirect(`${frontendUrl}/dashboard/connections?error=tiktok_auth_failed`);
        }
    }
}
