import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Platform } from '@prisma/client';

@Injectable()
export class FacebookService {
    private readonly logger = new Logger(FacebookService.name);

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {}

    getAuthUrl(userId: string, workspaceId: string): string {
        const clientId = this.configService.get<string>('FACEBOOK_CLIENT_ID')
            || this.configService.get<string>('INSTAGRAM_CLIENT_ID');
        const redirectUri = this.configService.get<string>('FACEBOOK_REDIRECT_URI');
        if (!clientId || !redirectUri) throw new BadRequestException('Facebook OAuth not configured');

        const state = Buffer.from(JSON.stringify({ userId, workspaceId })).toString('base64');
        const scopes = [
            'pages_manage_posts', 'pages_read_engagement', 'pages_show_list',
            'pages_manage_metadata', 'read_insights',
        ].join(',');

        return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scopes}&response_type=code`;
    }

    async handleCallback(code: string, state: string) {
        const { userId, workspaceId } = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));

        const clientId = this.configService.get<string>('FACEBOOK_CLIENT_ID')
            || this.configService.get<string>('INSTAGRAM_CLIENT_ID');
        const clientSecret = this.configService.get<string>('FACEBOOK_CLIENT_SECRET')
            || this.configService.get<string>('INSTAGRAM_CLIENT_SECRET');
        const redirectUri = this.configService.get<string>('FACEBOOK_REDIRECT_URI');

        const tokenRes = await fetch(
            `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri!)}&client_secret=${clientSecret}&code=${code}`,
        );
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || tokenData.error) throw new BadRequestException(tokenData.error?.message || 'Token exchange failed');

        const llRes = await fetch(
            `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${tokenData.access_token}`,
        );
        const llData = await llRes.json();
        const userToken = llData.access_token || tokenData.access_token;
        const userTokenExpiry = llData.expires_in ? new Date(Date.now() + llData.expires_in * 1000) : null;

        const pagesRes = await fetch(
            `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${userToken}`,
        );
        const pagesData = await pagesRes.json();
        const pages = pagesData.data ?? [];

        if (pages.length === 0) {
            this.logger.warn(`User ${userId} has no managed Facebook Pages`);
            return { success: true, pagesConnected: 0 };
        }

        for (const page of pages) {
            await this.prisma.socialAccount.upsert({
                where: {
                    workspaceId_platform_platformId: {
                        workspaceId,
                        platform: Platform.FACEBOOK,
                        platformId: page.id,
                    },
                },
                update: {
                    accessToken: page.access_token,
                    tokenExpiry: userTokenExpiry,
                    displayName: page.name,
                    isActive: true,
                    scopes: ['pages_manage_posts', 'pages_read_engagement'],
                },
                create: {
                    userId,
                    workspaceId,
                    platform: Platform.FACEBOOK,
                    platformId: page.id,
                    displayName: page.name,
                    accessToken: page.access_token,
                    tokenExpiry: userTokenExpiry,
                    isActive: true,
                    scopes: ['pages_manage_posts', 'pages_read_engagement'],
                    metaJson: JSON.stringify({ pageId: page.id }),
                },
            });
        }

        return { success: true, pagesConnected: pages.length };
    }
}
