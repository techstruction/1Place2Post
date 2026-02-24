import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBotRuleDto, BotMatchType } from './dto/create-bot-rule.dto';
import { BotMatchType as PrismaBotMatchType } from '@prisma/client';

@Injectable()
export class BotRuleService {
    constructor(private prisma: PrismaService) { }

    create(userId: string, dto: CreateBotRuleDto) {
        return this.prisma.botRule.create({
            data: {
                userId,
                name: dto.name,
                matchType: dto.matchType as unknown as PrismaBotMatchType,
                matchValue: dto.matchValue,
                replyText: dto.replyText,
                webhookUrl: dto.webhookUrl,
                active: dto.active ?? true,
            },
        });
    }

    findAll(userId: string) {
        return this.prisma.botRule.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    }

    async update(userId: string, id: string, dto: Partial<CreateBotRuleDto>) {
        const rule = await this.prisma.botRule.findUnique({ where: { id } });
        if (!rule) throw new NotFoundException();
        if (rule.userId !== userId) throw new ForbiddenException();
        return this.prisma.botRule.update({
            where: { id },
            data: {
                ...dto,
                matchType: dto.matchType as unknown as PrismaBotMatchType | undefined,
            },
        });
    }

    async remove(userId: string, id: string) {
        const rule = await this.prisma.botRule.findUnique({ where: { id } });
        if (!rule) throw new NotFoundException();
        if (rule.userId !== userId) throw new ForbiddenException();
        return this.prisma.botRule.delete({ where: { id } });
    }

    // ── Ingest: match active rules for a user and fire webhooks ─────────────
    async processIngest(userId: string, message: string, platform: string): Promise<{ matched: boolean; rule?: string }> {
        const rules = await this.prisma.botRule.findMany({ where: { userId, active: true } });

        for (const rule of rules) {
            let matched = false;
            if (rule.matchType === 'ANY') {
                matched = true;
            } else if (rule.matchType === 'CONTAINS') {
                matched = message.toLowerCase().includes(rule.matchValue.toLowerCase());
            } else if (rule.matchType === 'REGEX') {
                try { matched = new RegExp(rule.matchValue, 'i').test(message); } catch { matched = false; }
            }

            if (matched && rule.webhookUrl) {
                // Fire-and-forget — don't await to avoid blocking the response
                fetch(rule.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'bot.reply', platform, message, replyText: rule.replyText, ruleName: rule.name }),
                }).catch(() => { /* silent */ });

                return { matched: true, rule: rule.name };
            }
        }
        return { matched: false };
    }
}
