import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InboxService {
    constructor(private prisma: PrismaService) { }

    findAll(userId: string) {
        return this.prisma.inboxMessage.findMany({
            where: { userId },
            orderBy: { receivedAt: 'desc' },
            include: { socialAccount: true },
        });
    }

    async getUnreadCount(userId: string) {
        return this.prisma.inboxMessage.count({ where: { userId, isRead: false } });
    }

    async markRead(userId: string, id: string) {
        const msg = await this.prisma.inboxMessage.findUnique({ where: { id } });
        if (!msg) throw new NotFoundException('Message not found');
        if (msg.userId !== userId) throw new ForbiddenException();

        return this.prisma.inboxMessage.update({
            where: { id },
            data: { isRead: true },
        });
    }

    async markAllRead(userId: string) {
        const result = await this.prisma.inboxMessage.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return { updated: result.count };
    }
}
