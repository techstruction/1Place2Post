import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Platform } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class TiktokService {
    private readonly logger = new Logger(TiktokService.name);
    private tempStore = new Map<string, { codeVerifier: string; userId: string; workspaceId: string }>();

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {}

    getAuthUrl(userId: string, workspaceId: string): string {
        const clientKey = this.configService.get<string>('TIKTOK_CLIENT_KEY');
        const redirectUri = this.configService.get<string>('TIKTOK_REDIRECT_URI');
        if (!clientKey || !redirectUri) throw new BadRequestException('TikTok OAuth not configured');

        const codeVerifier = randomBytes(32).toString('base64url');
        const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
        const state = randomBytes(16).toString('hex');
        this.tempStore.set(state, { codeVerifier, userId, workspaceId });
        setTimeout(() => this.tempStore.delete(state), 10 * 60 * 1000);

        const scopes = ['user.info.basic', 'video.publish', 'video.upload'].join(',');
        const params = new URLSearchParams({
            client_key: clientKey, redirect_uri: redirectUri,
            scope: scopes, response_type: 'code', state,
            code_challenge: codeChallenge, code_challenge_method: 'S256',
        });

        return `https://www.tiktok.com/v2/auth/authorize?${params}`;
    }

    async handleCallback(code: string, state: string) {
        const stored = this.tempStore.get(state);
        if (!stored) throw new BadRequestException('Invalid or expired state');
        const { codeVerifier, userId, workspaceId } = stored;
        this.tempStore.delete(state);

        const clientKey = this.configService.get<string>('TIKTOK_CLIENT_KEY');
        const clientSecret = this.configService.get<string>('TIKTOK_CLIENT_SECRET');
        const redirectUri = this.configService.get<string>('TIKTOK_REDIRECT_URI');

        const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: clientKey!, client_secret: clientSecret!,
                code, grant_type: 'authorization_code',
                redirect_uri: redirectUri!, code_verifier: codeVerifier,
            }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || tokenData.error) throw new BadRequestException(tokenData.error || 'Token exchange failed');

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;
        const tokenExpiry = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null;
        const openId = tokenData.open_id;

        const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const userData = await userRes.json();
        const userInfo = userData.data?.user ?? {};

        await this.prisma.socialAccount.upsert({
            where: {
                workspaceId_platform_platformId: { workspaceId, platform: Platform.TIKTOK, platformId: openId },
            },
            update: { accessToken, refreshToken, tokenExpiry, displayName: userInfo.display_name, username: userInfo.username, isActive: true },
            create: {
                userId, workspaceId, platform: Platform.TIKTOK, platformId: openId,
                displayName: userInfo.display_name, username: userInfo.username,
                accessToken, refreshToken, tokenExpiry, isActive: true,
                scopes: ['user.info.basic', 'video.publish', 'video.upload'], metaJson: '{}',
            },
        });

        return { success: true, platformId: openId };
    }
}
