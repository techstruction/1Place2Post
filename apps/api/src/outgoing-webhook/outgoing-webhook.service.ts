import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export class CreateOutgoingWebhookDto {
    name: string;
    url: string;
    secret?: string;
    events: string[];
}

@Injectable()
export class OutgoingWebhookService {
    constructor(private prisma: PrismaService) { }

    create(userId: string, dto: CreateOutgoingWebhookDto) {
        return this.prisma.outgoingWebhook.create({
            data: { userId, name: dto.name, url: dto.url, secret: dto.secret ?? null, eventsJson: JSON.stringify(dto.events ?? []) },
        });
    }

    findAll(userId: string) {
        return this.prisma.outgoingWebhook.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    }

    async update(userId: string, id: string, dto: Partial<CreateOutgoingWebhookDto> & { isActive?: boolean }) {
        const w = await this.prisma.outgoingWebhook.findUnique({ where: { id } });
        if (!w) throw new NotFoundException();
        if (w.userId !== userId) throw new ForbiddenException();
        const data: any = { ...dto };
        if (dto.events) { data.eventsJson = JSON.stringify(dto.events); delete data.events; }
        return this.prisma.outgoingWebhook.update({ where: { id }, data });
    }

    async remove(userId: string, id: string) {
        const w = await this.prisma.outgoingWebhook.findUnique({ where: { id } });
        if (!w) throw new NotFoundException();
        if (w.userId !== userId) throw new ForbiddenException();
        return this.prisma.outgoingWebhook.delete({ where: { id } });
    }

    /** Fire all active webhooks for a user that subscribe to the given event */
    async fire(userId: string, event: string, payload: object) {
        const webhooks = await this.prisma.outgoingWebhook.findMany({ where: { userId, isActive: true } });
        for (const wh of webhooks) {
            const events: string[] = JSON.parse(wh.eventsJson || '[]');
            if (events.length > 0 && !events.includes(event)) continue;

            const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (wh.secret) {
                const sig = crypto.createHmac('sha256', wh.secret).update(body).digest('hex');
                headers['X-1P2P-Signature'] = `sha256=${sig}`;
            }

            fetch(wh.url, { method: 'POST', headers, body, signal: AbortSignal.timeout(8_000) })
                .catch(err => console.error(`[OutgoingWebhook] ${wh.id} failed:`, err.message));
        }
    }
}
