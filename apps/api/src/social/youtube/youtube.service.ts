import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Platform } from '@prisma/client';

@Injectable()
export class YoutubeService {
    private readonly logger = new Logger(YoutubeService.name);

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {}

    getAuthUrl(userId: string, workspaceId: string): string {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        const redirectUri = this.configService.get<string>('YOUTUBE_REDIRECT_URI');
        if (!clientId || !redirectUri) throw new BadRequestException('YouTube OAuth not configured');

        const state = Buffer.from(JSON.stringify({ userId, workspaceId })).toString('base64');
        const scopes = [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/userinfo.profile',
        ].join(' ');

        const params = new URLSearchParams({
            client_id: clientId, redirect_uri: redirectUri,
            response_type: 'code', scope: scopes, state,
            access_type: 'offline', prompt: 'consent',
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    }

    async handleCallback(code: string, state: string) {
        const { userId, workspaceId } = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));

        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
        const redirectUri = this.configService.get<string>('YOUTUBE_REDIRECT_URI');

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code, client_id: clientId!, client_secret: clientSecret!,
                redirect_uri: redirectUri!, grant_type: 'authorization_code',
            }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || tokenData.error) throw new BadRequestException(tokenData.error || 'Token exchange failed');

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;
        const tokenExpiry = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null;

        const channelRes = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&access_token=${accessToken}`,
        );
        const channelData = await channelRes.json();
        const channel = channelData.items?.[0];
        if (!channel) throw new BadRequestException('No YouTube channel found for this Google account');

        await this.prisma.socialAccount.upsert({
            where: {
                workspaceId_platform_platformId: { workspaceId, platform: Platform.YOUTUBE, platformId: channel.id },
            },
            update: { accessToken, refreshToken, tokenExpiry, displayName: channel.snippet?.title, isActive: true },
            create: {
                userId, workspaceId, platform: Platform.YOUTUBE, platformId: channel.id,
                displayName: channel.snippet?.title,
                username: channel.snippet?.customUrl ?? channel.id,
                accessToken, refreshToken, tokenExpiry, isActive: true,
                scopes: ['youtube.upload', 'youtube.readonly'], metaJson: '{}',
            },
        });

        return { success: true, channelId: channel.id };
    }
}
