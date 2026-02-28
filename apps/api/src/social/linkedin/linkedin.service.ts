import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Platform } from '@prisma/client';

@Injectable()
export class LinkedinService {
    private readonly logger = new Logger(LinkedinService.name);
    private prisma = new PrismaClient();

    constructor(private configService: ConfigService) { }

    getAuthUrl(userId: string): string {
        // Needs LINKEDIN_CLIENT_ID
        const clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID');
        const redirectUri = this.configService.get<string>('LINKEDIN_REDIRECT_URI');

        if (!clientId || !redirectUri) {
            throw new BadRequestException('LinkedIn OAuth credentials are not configured');
        }

        const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
        const scopes = 'r_organization_social w_organization_social r_liteprofile w_member_social';
        const encodedScopes = encodeURIComponent(scopes);

        return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${encodedScopes}`;
    }

    async handleCallback(code: string, state: string) {
        try {
            const { userId } = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));

            // Needs LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET
            const clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID');
            const clientSecret = this.configService.get<string>('LINKEDIN_CLIENT_SECRET');
            const redirectUri = this.configService.get<string>('LINKEDIN_REDIRECT_URI');

            const tokenParams = new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri || '',
                client_id: clientId || '',
                client_secret: clientSecret || '',
            });

            const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: tokenParams.toString(),
            });

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok || tokenData.error) {
                throw new Error(tokenData.error_description || tokenData.error || 'Failed to get access token');
            }

            const accessToken = tokenData.access_token;
            const expiresIn = tokenData.expires_in;
            const tokenExpiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
            const refreshToken = tokenData.refresh_token || null;

            const meResponse = await fetch('https://api.linkedin.com/v2/me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const meData = await meResponse.json();

            if (!meResponse.ok) {
                throw new Error(meData.message || 'Failed to fetch user profile');
            }

            const linkedinId = meData.id;
            const urn = `urn:li:person:${linkedinId}`;
            const firstName = meData.firstName?.localized?.[Object.keys(meData.firstName.localized || {})[0]] || '';
            const lastName = meData.lastName?.localized?.[Object.keys(meData.lastName.localized || {})[0]] || '';
            const displayName = `${firstName} ${lastName}`.trim() || 'LinkedIn User';

            // @ts-ignore - Assuming Platform.LINKEDIN is already configured in the user's Prisma schema
            const platformLinkedIn = 'LINKEDIN' as Platform;

            await this.prisma.socialAccount.upsert({
                where: {
                    userId_platform_platformId: {
                        userId,
                        platform: platformLinkedIn,
                        platformId: urn,
                    },
                },
                update: {
                    accessToken,
                    refreshToken,
                    tokenExpiry,
                    displayName,
                    isActive: true,
                    scopes: ['r_organization_social', 'w_organization_social', 'r_liteprofile', 'w_member_social'],
                },
                create: {
                    userId,
                    platform: platformLinkedIn,
                    platformId: urn,
                    accessToken,
                    refreshToken,
                    tokenExpiry,
                    displayName,
                    isActive: true,
                    scopes: ['r_organization_social', 'w_organization_social', 'r_liteprofile', 'w_member_social'],
                    metaJson: JSON.stringify({}),
                },
            });

            return { success: true, platformId: urn };
        } catch (error) {
            this.logger.error('Error handling LinkedIn callback', error);
            throw new BadRequestException('Failed to connect LinkedIn account');
        }
    }

    async publishPost(userId: string, content: string) {
        // @ts-ignore - Assuming Platform.LINKEDIN is already configured in the user's Prisma schema
        const platformLinkedIn = 'LINKEDIN' as Platform;

        const account = await this.prisma.socialAccount.findFirst({
            where: {
                userId,
                platform: platformLinkedIn,
                isActive: true,
            },
        });

        if (!account) {
            throw new BadRequestException('No active LinkedIn account found for this user');
        }

        const urn = account.platformId;
        const accessToken = account.accessToken;

        const postData = {
            author: urn,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: content,
                    },
                    shareMediaCategory: 'NONE',
                },
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
            },
        };

        const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify(postData),
        });

        const result = await postResponse.json();

        if (!postResponse.ok) {
            this.logger.error('Error publishing to LinkedIn', result);
            throw new BadRequestException('Failed to publish post to LinkedIn');
        }

        return result;
    }
}
