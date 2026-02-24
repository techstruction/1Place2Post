import { Injectable, NotFoundException, ForbiddenException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRssCampaignDto } from './dto/create-rss-campaign.dto';

@Injectable()
export class RssCampaignService implements OnModuleInit, OnModuleDestroy {
    private pollInterval: ReturnType<typeof setInterval> | null = null;
    private readonly POLL_MS = 15 * 60 * 1000; // 15 minutes

    constructor(private prisma: PrismaService) { }

    onModuleInit() {
        // Start background RSS polling — will be replaced by Bull queue in Phase 5
        this.pollInterval = setInterval(() => this.pollAll(), this.POLL_MS);
    }

    onModuleDestroy() {
        if (this.pollInterval) clearInterval(this.pollInterval);
    }

    create(userId: string, dto: CreateRssCampaignDto) {
        return this.prisma.rssCampaign.create({
            data: { userId, name: dto.name, rssUrl: dto.rssUrl, template: dto.template ?? '{{title}} {{link}}', socialAccountId: dto.socialAccountId },
        });
    }

    findAll(userId: string) {
        return this.prisma.rssCampaign.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    }

    async update(userId: string, id: string, dto: Partial<CreateRssCampaignDto> & { isActive?: boolean }) {
        const c = await this.prisma.rssCampaign.findUnique({ where: { id } });
        if (!c) throw new NotFoundException();
        if (c.userId !== userId) throw new ForbiddenException();
        return this.prisma.rssCampaign.update({ where: { id }, data: dto });
    }

    async remove(userId: string, id: string) {
        const c = await this.prisma.rssCampaign.findUnique({ where: { id } });
        if (!c) throw new NotFoundException();
        if (c.userId !== userId) throw new ForbiddenException();
        return this.prisma.rssCampaign.delete({ where: { id } });
    }

    /** Poll all active campaigns and create posts for new items */
    async pollAll() {
        const campaigns = await this.prisma.rssCampaign.findMany({ where: { isActive: true } });
        for (const campaign of campaigns) {
            try {
                await this.pollOne(campaign);
            } catch (err) {
                console.error(`[RssCampaign] Poll failed for ${campaign.id}:`, (err as Error).message);
            }
        }
    }

    private async pollOne(campaign: { id: string; userId: string; rssUrl: string; template: string; lastItemGuid: string | null }) {
        const res = await fetch(campaign.rssUrl, { signal: AbortSignal.timeout(10_000) });
        if (!res.ok) return;
        const xml = await res.text();

        // Minimal RSS/Atom parser — extract items
        const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
            const get = (tag: string) => m[1].match(new RegExp(`<${tag}[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/${tag}>`))?.[1]?.trim() ?? '';
            return { guid: get('guid') || get('link'), title: get('title'), link: get('link') };
        });

        if (items.length === 0) return;

        // Find new items since lastItemGuid
        let newItems = items;
        if (campaign.lastItemGuid) {
            const idx = items.findIndex(i => i.guid === campaign.lastItemGuid);
            newItems = idx >= 0 ? items.slice(0, idx) : items;
        }

        for (const item of newItems.reverse()) { // oldest first
            const caption = campaign.template
                .replace('{{title}}', item.title)
                .replace('{{link}}', item.link);
            await this.prisma.post.create({ data: { userId: campaign.userId, caption, hashtags: [], status: 'DRAFT' } });
        }

        if (items[0]?.guid) {
            await this.prisma.rssCampaign.update({ where: { id: campaign.id }, data: { lastItemGuid: items[0].guid, lastFetchedAt: new Date() } });
        }
    }
}
