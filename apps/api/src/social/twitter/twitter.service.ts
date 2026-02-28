import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Platform } from '@prisma/client';
import { TwitterApi } from 'twitter-api-v2';

@Injectable()
export class TwitterService {
    private readonly logger = new Logger(TwitterService.name);
    private prisma = new PrismaClient();

    // In-memory store for PKCE code verifiers.
    // NOTE: For multi-node deployments, replace this with Redis or a database table.
    private tempAuthStore = new Map<string, { codeVerifier: string; userId: string }>();

    constructor(private configService: ConfigService) { }

    private getClient() {
        // Commented where we need credentials
        const clientId = this.configService.get<string>('TWITTER_CLIENT_ID');
        const clientSecret = this.configService.get<string>('TWITTER_CLIENT_SECRET');

        if (!clientId || !clientSecret) {
            throw new BadRequestException('Twitter OAuth credentials are not configured (TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET)');
        }

        return new TwitterApi({ clientId, clientSecret });
    }

    getAuthUrl(userId: string): string {
        const client = this.getClient();
        const redirectUri = this.configService.get<string>('TWITTER_REDIRECT_URI');

        if (!redirectUri) {
            throw new BadRequestException('Twitter redirect URI is not configured');
        }

        // Generate Auth URL with PKCE
        const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
            redirectUri,
            { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
        );

        // Store the verifier and userId against the state parameter
        this.tempAuthStore.set(state, { codeVerifier, userId });

        // Expire the state after 10 minutes to prevent memory leaks
        setTimeout(() => {
            this.tempAuthStore.delete(state);
        }, 10 * 60 * 1000);

        return url;
    }

    async handleCallback(code: string, state: string) {
        const authData = this.tempAuthStore.get(state);

        if (!authData) {
            throw new BadRequestException('Invalid or expired state parameter');
        }

        const { codeVerifier, userId } = authData;
        this.tempAuthStore.delete(state);

        try {
            const client = this.getClient();
            const redirectUri = this.configService.get<string>('TWITTER_REDIRECT_URI');

            // Exchange code for access & refresh tokens
            const { client: loggedClient, accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
                code,
                codeVerifier,
                redirectUri: redirectUri as string,
            });

            const tokenExpiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

            // Get user info (X / Twitter account ID & username)
            const me = await loggedClient.v2.me();
            const twitterUserId = me.data.id;
            const twitterUsername = me.data.username;
            const displayName = me.data.name;

            // Upsert / Save the Token to the Database
            await this.prisma.socialAccount.upsert({
                where: {
                    userId_platform_platformId: {
                        userId,
                        platform: Platform.TWITTER,
                        platformId: twitterUserId,
                    },
                },
                update: {
                    accessToken,
                    refreshToken,
                    tokenExpiry,
                    username: twitterUsername,
                    displayName: displayName,
                    isActive: true,
                    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
                },
                create: {
                    userId,
                    platform: Platform.TWITTER,
                    platformId: twitterUserId,
                    username: twitterUsername,
                    displayName: displayName,
                    accessToken,
                    refreshToken,
                    tokenExpiry,
                    isActive: true,
                    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
                    metaJson: JSON.stringify({}),
                },
            });

            return { success: true, platformId: twitterUserId };
        } catch (error) {
            this.logger.error('Error handling Twitter callback', error);
            throw new BadRequestException('Failed to connect Twitter account');
        }
    }

    async publishPost(userId: string, text: string) {
        // Fetch the user's Twitter account
        const account = await this.prisma.socialAccount.findFirst({
            where: {
                userId,
                platform: Platform.TWITTER,
                isActive: true,
            },
        });

        if (!account) {
            throw new BadRequestException('No active Twitter account found for this user');
        }

        try {
            // Re-instantiate the client with the user's access token
            let client = new TwitterApi(account.accessToken);

            // Check if token needs refresh
            if (account.tokenExpiry && new Date() >= account.tokenExpiry) {
                if (!account.refreshToken) {
                    throw new Error('Access token expired and no refresh token available');
                }

                const baseClient = this.getClient();
                // Refresh the token
                const { client: refreshedClient, accessToken, refreshToken: newRefreshToken, expiresIn } = await baseClient.refreshOAuth2Token(account.refreshToken);

                client = refreshedClient;

                const newExpiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

                // Update the tokens in DB
                await this.prisma.socialAccount.update({
                    where: { id: account.id },
                    data: {
                        accessToken,
                        refreshToken: newRefreshToken,
                        tokenExpiry: newExpiry
                    }
                });
            }

            // Post the tweet
            const response = await client.v2.tweet(text);
            return response.data;
        } catch (error) {
            this.logger.error('Error publishing to Twitter', error);
            throw new BadRequestException('Failed to publish tweet');
        }
    }
}
