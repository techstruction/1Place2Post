import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Platform } from '@prisma/client';

@Injectable()
export class {{ Platform }}Service {
    private readonly logger = new Logger({{ Platform }} Service.name);
    private prisma = new PrismaClient();

constructor(private configService: ConfigService) { }

getAuthUrl(userId: string): string {
    const clientId = this.configService.get<string>('{{PLATFORM_UPPER}}_CLIENT_ID');
    const redirectUri = this.configService.get<string>('{{PLATFORM_UPPER}}_REDIRECT_URI');

    if (!clientId || !redirectUri) {
        throw new BadRequestException('{{Platform}} OAuth credentials are not configured');
    }

    // Pass the userId in the state parameter to know who to attribute the token to upon callback
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

    // TODO: Replace with actual {{Platform}} OAuth URL
    const authUrl = `https://api.{{platform}}.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code`;

    return authUrl;
}

    async handleCallback(code: string, state: string) {
    try {
        // Decode state to get the userId
        const { userId } = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));

        const clientId = this.configService.get<string>('{{PLATFORM_UPPER}}_CLIENT_ID');
        const clientSecret = this.configService.get<string>('{{PLATFORM_UPPER}}_CLIENT_SECRET');
        const redirectUri = this.configService.get<string>('{{PLATFORM_UPPER}}_REDIRECT_URI');

        // 1. Exchange code for access token
        // TODO: Replace with actual {{Platform}} token endpoint
        const tokenResponse = await fetch(`https://api.{{platform}}.com/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId || '',
                client_secret: clientSecret || '',
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri || '',
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || tokenData.error) {
            throw new Error(tokenData.error_description || tokenData.error || 'Failed to get access token');
        }

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;
        const expiresIn = tokenData.expires_in;
        const tokenExpiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

        // 2. Get User's {{Platform}} ID
        // TODO: Replace with actual {{Platform}} user info endpoint
        const meResponse = await fetch(`https://api.{{platform}}.com/v1/user/me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        });
        const meData = await meResponse.json();
        const platformUserId = meData.id;

        // 3. Upsert the SocialAccount to the Database
        await this.prisma.socialAccount.upsert({
            where: {
                userId_platform_platformId: {
                    userId,
                    platform: Platform.{{ PLATFORM_UPPER }},
    platformId: platformUserId,
                    },
                },
update: {
    accessToken,
        refreshToken,
        tokenExpiry,
        displayName: meData.username || '{{Platform}} User',
            isActive: true,
                },
create: {
    userId,
        platform: Platform.{ { PLATFORM_UPPER } },
    platformId: platformUserId,
        accessToken,
        refreshToken,
        tokenExpiry,
        displayName: meData.username || '{{Platform}} User',
            isActive: true,
                },
            });

return { success: true, platformId: platformUserId };
        } catch (error) {
    this.logger.error('Error handling {{Platform}} callback', error);
    throw new BadRequestException('Failed to connect {{Platform}} account');
}
    }

    /**
     * Stubs out publishing a post to the platform
     */
    async publishPost(socialAccountId: string, content: string, mediaUrls ?: string[]): Promise < any > {
    const account = await this.prisma.socialAccount.findUnique({
        where: { id: socialAccountId },
    });

    if(!account || !account.accessToken) {
    throw new BadRequestException('Social account not found or not authenticated');
}

// TODO: Implement actual {{Platform}} publishing logic
this.logger.log(`Publishing post to {{Platform}} account ${account.displayName}: ${content}`);

return {
    success: true,
    postId: 'mock_post_id_' + Date.now(),
    publishedAt: new Date(),
};
    }
}
