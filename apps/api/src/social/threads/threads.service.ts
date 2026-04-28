import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Platform } from '@prisma/client';

@Injectable()
export class ThreadsService {
    private readonly logger = new Logger(ThreadsService.name);

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {}

    getAuthUrl(userId: string, workspaceId: string): string {
        const clientId = this.configService.get<string>('THREADS_CLIENT_ID');
        const redirectUri = this.configService.get<string>('THREADS_REDIRECT_URI');
        if (!clientId || !redirectUri) throw new BadRequestException('Threads OAuth credentials not configured');

        const state = Buffer.from(JSON.stringify({ userId, workspaceId })).toString('base64');
        const scopes = ['threads_basic', 'threads_content_publish'].join(',');

        return `https://threads.net/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${state}`;
    }

    async handleCallback(code: string, state: string) {
        const { userId, workspaceId } = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));

        const clientId = this.configService.get<string>('THREADS_CLIENT_ID');
        const clientSecret = this.configService.get<string>('THREADS_CLIENT_SECRET');
        const redirectUri = this.configService.get<string>('THREADS_REDIRECT_URI');

        const tokenRes = await fetch('https://graph.threads.net/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId!, client_secret: clientSecret!,
                grant_type: 'authorization_code', redirect_uri: redirectUri!, code,
            }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || tokenData.error) throw new BadRequestException(tokenData.error_message || 'Token exchange failed');

        const llRes = await fetch(
            `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${clientSecret}&access_token=${tokenData.access_token}`,
        );
        const llData = await llRes.json();
        const accessToken = llData.access_token || tokenData.access_token;
        const tokenExpiry = llData.expires_in ? new Date(Date.now() + llData.expires_in * 1000) : null;

        const meRes = await fetch(
            `https://graph.threads.net/v1.0/me?fields=id,username,name&access_token=${accessToken}`,
        );
        const meData = await meRes.json();

        await this.prisma.socialAccount.upsert({
            where: {
                workspaceId_platform_platformId: { workspaceId, platform: Platform.THREADS, platformId: meData.id },
            },
            update: { accessToken, tokenExpiry, displayName: meData.name, username: meData.username, isActive: true },
            create: {
                userId, workspaceId, platform: Platform.THREADS, platformId: meData.id,
                username: meData.username, displayName: meData.name,
                accessToken, tokenExpiry, isActive: true,
                scopes: ['threads_basic', 'threads_content_publish'], metaJson: '{}',
            },
        });

        return { success: true, platformId: meData.id };
    }
}
