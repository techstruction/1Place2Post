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
                triggerType: dto.triggerType || 'comment',
                platform: dto.platform as any || null,
                socialAccountId: dto.socialAccountId || null,
                matchType: dto.matchType as unknown as PrismaBotMatchType,
                matchValue: dto.matchValue,
                replyMode: dto.replyMode || 'reply',
                replyText: dto.replyText,
                webhookUrl: dto.webhookUrl,
                cooldownSeconds: dto.cooldownSeconds || 0,
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
                platform: dto.platform as any | undefined,
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
    async processIngest(userId: string, message: string, platform: string, fromHandle?: string) {
        // 1. Create InboxMessage
        const inboxMsg = await this.prisma.inboxMessage.create({
            data: {
                userId,
                platform: platform as any,
                message,
                fromHandle,
                kind: 'COMMENT', // or DM if we detect it
            }
        });

        const rules = await this.prisma.botRule.findMany({ where: { userId, active: true } });

        for (const rule of rules) {
            // Check platform match if rule has one
            if (rule.platform && rule.platform.toLowerCase() !== platform.toLowerCase()) continue;

            let matched = false;
            if (rule.matchType === 'ANY') {
                matched = true;
            } else if (rule.matchType === 'CONTAINS') {
                matched = message.toLowerCase().includes(rule.matchValue.toLowerCase());
            } else if (rule.matchType === 'REGEX') {
                try { matched = new RegExp(rule.matchValue, 'i').test(message); } catch { matched = false; }
            }

            if (matched) {
                // 2. Create BotActionLog
                await this.prisma.botActionLog.create({
                    data: {
                        botRuleId: rule.id,
                        userId,
                        inboxMessageId: inboxMsg.id,
                        socialAccountId: rule.socialAccountId,
                        actionTaken: `Replied via ${rule.replyMode}`,
                        replyText: rule.replyText,
                    }
                });

                // 3. Create or update Lead if we have a handle
                if (fromHandle) {
                    const existingLead = await this.prisma.lead.findFirst({
                        where: { userId, handle: fromHandle }
                    });
                    if (!existingLead) {
                        await this.prisma.lead.create({
                            data: {
                                userId,
                                handle: fromHandle,
                                sourceMessageId: inboxMsg.id,
                                socialAccountId: rule.socialAccountId,
                            }
                        });
                    }
                }

                // Fire webhook
                if (rule.webhookUrl) {
                    fetch(rule.webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'bot.reply', platform, message, replyText: rule.replyText, ruleName: rule.name, handle: fromHandle }),
                    }).catch(() => { /* silent */ });
                }

                return { matched: true, rule: rule.name };
            }
        }
        return { matched: false };
    }
}
