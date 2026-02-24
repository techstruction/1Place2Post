import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'PUBLISH_SUCCESS' | 'PUBLISH_FAILED' | 'APPROVAL' | 'SUPPORT';

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

    notify(userId: string, type: NotificationType, title: string, body?: string, meta?: object) {
        return this.prisma.notification.create({
            data: { userId, type, title, body: body ?? null, metaJson: JSON.stringify(meta ?? {}) },
        });
    }

    findAll(userId: string, limit = 50) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
            take: limit,
        });
    }

    unreadCount(userId: string) {
        return this.prisma.notification.count({ where: { userId, isRead: false } });
    }

    markRead(userId: string, id: string) {
        return this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
    }

    markAllRead(userId: string) {
        return this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    }
}
