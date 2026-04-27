import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenHealthService } from '../token-health/token-health.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';

@Injectable()
export class SocialAccountService {
    constructor(
        private prisma: PrismaService,
        private tokenHealth: TokenHealthService,
    ) {}

    async findAll(userId: string) {
        return this.prisma.socialAccount.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                platform: true,
                platformId: true,
                username: true,
                displayName: true,
                tokenExpiry: true,
                tokenStatus: true,
                isActive: true,
                scopes: true,
                metaJson: true,
                createdAt: true,
                updatedAt: true,
            },
        });
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

    async updateTokens(
        userId: string,
        id: string,
        tokens: { accessToken: string; refreshToken?: string | null; tokenExpiry?: Date | null },
    ): Promise<void> {
        const account = await this.prisma.socialAccount.findUnique({ where: { id } });
        if (!account) throw new NotFoundException('Social account not found');
        if (account.userId !== userId) throw new ForbiddenException();

        await this.prisma.socialAccount.update({
            where: { id },
            data: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken ?? account.refreshToken,
                tokenExpiry: tokens.tokenExpiry ?? account.tokenExpiry,
                tokenStatus: 'ACTIVE',
            },
        });

        await this.tokenHealth.unblockJobsForAccount(id);
    }

    async remove(userId: string, id: string) {
        const account = await this.prisma.socialAccount.findUnique({ where: { id } });
        if (!account) throw new NotFoundException('Social account not found');
        if (account.userId !== userId) throw new ForbiddenException();
        return this.prisma.socialAccount.delete({ where: { id } });
    }
}
