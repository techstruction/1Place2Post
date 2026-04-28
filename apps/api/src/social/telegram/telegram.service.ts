import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Platform } from '@prisma/client';

export interface ConnectTelegramDto {
    botToken: string;
    channelUsername: string;
    workspaceId: string;
}

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);

    constructor(private prisma: PrismaService) {}

    async connectChannel(userId: string, dto: ConnectTelegramDto) {
        const { botToken, channelUsername, workspaceId } = dto;

        const target = channelUsername.startsWith('@') ? channelUsername : `@${channelUsername}`;

        const chatRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${target}`);
        const chatData = await chatRes.json();
        if (!chatData.ok) {
            throw new BadRequestException(
                `Could not access Telegram channel. Make sure the bot is an admin of ${target}. Error: ${chatData.description}`,
            );
        }

        const chat = chatData.result;
        const channelId = String(chat.id);
        const channelTitle = chat.title ?? chat.username ?? channelUsername;
        const channelHandle = chat.username ?? channelUsername.replace('@', '');

        await this.prisma.socialAccount.upsert({
            where: {
                workspaceId_platform_platformId: { workspaceId, platform: Platform.TELEGRAM, platformId: channelId },
            },
            update: { accessToken: botToken, displayName: channelTitle, username: channelHandle, isActive: true },
            create: {
                userId, workspaceId, platform: Platform.TELEGRAM, platformId: channelId,
                displayName: channelTitle, username: channelHandle,
                accessToken: botToken,
                isActive: true, scopes: ['bot'], metaJson: JSON.stringify({ channelId }),
            },
        });

        return { success: true, channelId, channelTitle };
    }
}
