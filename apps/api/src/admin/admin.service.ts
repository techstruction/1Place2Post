import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    async getStats() {
        const [userCount, postCount, queueDepth, socialAccountCount] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.post.count(),
            this.prisma.postPublishJob.count({ where: { status: { in: ['PENDING', 'RUNNING'] } } }),
            this.prisma.socialAccount.count(),
        ]);
        return { userCount, postCount, queueDepth, socialAccountCount };
    }

    async listUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                _count: { select: { posts: true, socialAccounts: true } },
            },
        });
    }

    async updateUser(id: string, data: { role?: string; name?: string }) {
        return this.prisma.user.update({
            where: { id },
            data: {
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(data.role !== undefined ? { role: data.role as any } : {}),
            },
        });
    }

    async deleteUser(id: string) {
        return this.prisma.user.delete({ where: { id } });
    }

    async getAuditLogs() {
        // Return last 200 admin actions from the audit log table — falls back to empty if table not yet migrated
        try {
            return await (this.prisma as any).auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 200,
            });
        } catch {
            return [];
        }
    }

    async logAction(adminId: string, action: string, targetId?: string, detail?: string) {
        try {
            await (this.prisma as any).auditLog.create({
                data: { adminId, action, targetId: targetId ?? null, detail: detail ?? null },
            });
        } catch { /* table may not exist yet */ }
    }

    async getFlags() {
        try {
            return await (this.prisma as any).featureFlag.findMany({ orderBy: { key: 'asc' } });
        } catch {
            return [];
        }
    }

    async setFlag(key: string, enabled: boolean) {
        try {
            return await (this.prisma as any).featureFlag.upsert({
                where: { key },
                update: { enabled },
                create: { key, enabled, description: key },
            });
        } catch {
            return { key, enabled };
        }
    }

    async getHealth() {
        let dbOk = false;
        try { await this.prisma.$queryRaw`SELECT 1`; dbOk = true; } catch { /* dead */ }
        return {
            api: true,
            database: dbOk,
            uptime: process.uptime(),
        };
    }
}
