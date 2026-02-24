import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';

const TOKEN_EXPIRY_WARNING_DAYS = 7;

@Injectable()
export class SocialAccountService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        const accounts = await this.prisma.socialAccount.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        const now = new Date();
        const warnThreshold = new Date(now.getTime() + TOKEN_EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);

        return accounts.map(a => ({
            ...a,
            tokenExpiring: a.tokenExpiry ? a.tokenExpiry < warnThreshold : false,
            tokenExpired: a.tokenExpiry ? a.tokenExpiry < now : false,
        }));
    }

    create(userId: string, dto: CreateSocialAccountDto) {
        return this.prisma.socialAccount.create({
            data: {
                userId,
                platform: dto.platform,
                platformId: dto.platformId,
                username: dto.username,
                displayName: dto.displayName,
                accessToken: dto.accessToken,
                refreshToken: dto.refreshToken,
                tokenExpiry: dto.tokenExpiry ? new Date(dto.tokenExpiry) : null,
                scopes: dto.scopes ?? [],
            },
        });
    }

    async remove(userId: string, id: string) {
        const account = await this.prisma.socialAccount.findUnique({ where: { id } });
        if (!account) throw new NotFoundException('Social account not found');
        if (account.userId !== userId) throw new ForbiddenException();
        return this.prisma.socialAccount.delete({ where: { id } });
    }
}
