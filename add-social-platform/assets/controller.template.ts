import { Controller, Get, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { {{ Platform }}Service } from './{{platform}}.service';
import type { Request, Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // Assuming standard JWT auth guard

@Controller('social/{{platform}}')
export class {{ Platform }}Controller {
    constructor(private readonly {{ platform }} Service: { { Platform } }Service) { }

@UseGuards(JwtAuthGuard)
@Get('auth')
async connect(@Req() req: any, @Res() res: ExpressResponse) {
    // JWT guard ensures req.user exists
    const userId = req.user?.id;
    if (!userId) {
        throw new UnauthorizedException('User not found in request');
    }

    const authUrl = this.{{ platform }
} Service.getAuthUrl(userId);
return res.redirect(authUrl);
    }

@Get('callback')
async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: ExpressResponse) {
    if (!code || !state) {
        return res.redirect('/dashboard/settings?error={{platform}}_auth_failed');
    }

    try {
        await this.{ { platform } } Service.handleCallback(code, state);
        // Redirect back to the frontend settings page
        return res.redirect('/dashboard/settings?success={{platform}}_connected');
    } catch (error) {
        return res.redirect('/dashboard/settings?error={{platform}}_auth_failed');
    }
}
}
