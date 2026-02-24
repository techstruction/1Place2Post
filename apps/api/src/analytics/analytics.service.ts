import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordEventDto } from './dto/record-event.dto';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    record(userId: string, dto: RecordEventDto) {
        return this.prisma.engagementEvent.create({
            data: {
                userId,
                platform: dto.platform,
                metric: dto.metric,
                value: dto.value,
                occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
            },
        });
    }

    /** Totals per metric, optionally summed per platform */
    async summary(userId: string) {
        const events = await this.prisma.engagementEvent.findMany({ where: { userId } });
        const totals: Record<string, number> = {};
        const byPlatform: Record<string, Record<string, number>> = {};

        for (const e of events) {
            totals[e.metric] = (totals[e.metric] ?? 0) + e.value;
            byPlatform[e.platform] ??= {};
            byPlatform[e.platform][e.metric] = (byPlatform[e.platform][e.metric] ?? 0) + e.value;
        }
        return { totals, byPlatform };
    }

    /** Events grouped by day for the last N days */
    async timeline(userId: string, days = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const events = await this.prisma.engagementEvent.findMany({
            where: { userId, occurredAt: { gte: since } },
            orderBy: { occurredAt: 'asc' },
        });

        const result: Record<string, Record<string, number>> = {};
        for (const e of events) {
            const day = e.occurredAt.toISOString().slice(0, 10);
            result[day] ??= {};
            result[day][e.metric] = (result[day][e.metric] ?? 0) + e.value;
        }
        return result;
    }
}
