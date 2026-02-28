import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Platform } from '@prisma/client';

@Injectable()
export class InstagramService {
    private readonly logger = new Logger(InstagramService.name);
    private prisma = new PrismaClient();

    constructor(private configService: ConfigService) { }

    getAuthUrl(userId: string): string {
        const clientId = this.configService.get<string>('INSTAGRAM_CLIENT_ID');
        const redirectUri = this.configService.get<string>('INSTAGRAM_REDIRECT_URI');

        if (!clientId || !redirectUri) {
            throw new BadRequestException('Instagram OAuth credentials are not configured');
        }

        // Pass the userId in the state parameter to know who to attribute the token to upon callback
        const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

        // Instagram/Facebook OAuth URL (Meta Graph API)
        // We request scopes needed for Instagram Graph API (posting content)
        const scopes = [
            'instagram_basic',
            'instagram_content_publish',
            'pages_show_list',
            'pages_read_engagement',
        ].join(',');

        return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scopes}&response_type=code`;
    }

    async handleCallback(code: string, state: string) {
        try {
            // Decode state to get the userId
            const { userId } = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));

            const clientId = this.configService.get<string>('INSTAGRAM_CLIENT_ID');
            const clientSecret = this.configService.get<string>('INSTAGRAM_CLIENT_SECRET');
            const redirectUri = this.configService.get<string>('INSTAGRAM_REDIRECT_URI');

            // 1. Exchange code for short-lived access token
            const tokenResponse = await fetch(
                `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`,
            );

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok || tokenData.error) {
                throw new Error(tokenData.error?.message || 'Failed to get access token');
            }

            const shortLivedToken = tokenData.access_token;

            // 2. Exchange short-lived token for long-lived token
            const longLivedResponse = await fetch(
                `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`,
            );

            const longLivedData = await longLivedResponse.json();
            const accessToken = longLivedData.access_token || shortLivedToken;
            const expiresIn = longLivedData.expires_in; // usually 60 days
            const tokenExpiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

            // 3. Get User's Facebook ID
            const meResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${accessToken}`);
            const meData = await meResponse.json();
            const fbUserId = meData.id;

            // 4. Upsert/Save the Token to the Database
            // Real implementation would also fetch connected Instagram Business Accounts here
            // and store that array inside the metaJson field.
            await this.prisma.socialAccount.upsert({
                where: {
                    userId_platform_platformId: {
                        userId,
                        platform: Platform.INSTAGRAM,
                        platformId: fbUserId,
                    },
                },
                update: {
                    accessToken,
                    tokenExpiry,
                    displayName: meData.name || 'Facebook User',
                    isActive: true,
                    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement'],
                },
                create: {
                    userId,
                    platform: Platform.INSTAGRAM,
                    platformId: fbUserId,
                    accessToken,
                    tokenExpiry,
                    displayName: meData.name || 'Facebook User',
                    isActive: true,
                    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement'],
                    metaJson: JSON.stringify({ note: 'Waiting for Page/IG Account Selection' })
                },
            });

            return { success: true, platformId: fbUserId };
        } catch (error) {
            this.logger.error('Error handling Instagram callback', error);
            throw new BadRequestException('Failed to connect Instagram account');
        }
    }
}
