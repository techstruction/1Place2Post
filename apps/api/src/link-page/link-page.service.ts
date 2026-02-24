import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLinkPageDto, CreateLinkItemDto } from './dto/link-page.dto';
import * as crypto from 'crypto';

@Injectable()
export class LinkPageService {
    constructor(private prisma: PrismaService) { }

    // ── Pages ───────────────────────────────────────────────────────────────
    async createPage(userId: string, dto: CreateLinkPageDto) {
        const existing = await this.prisma.linkPage.findUnique({ where: { slug: dto.slug } });
        if (existing) throw new ConflictException(`Slug "${dto.slug}" is already taken`);
        return this.prisma.linkPage.create({
            data: { userId, slug: dto.slug, title: dto.title, bio: dto.bio, avatarUrl: dto.avatarUrl, published: dto.published ?? false },
            include: { items: true },
        });
    }

    findAllPages(userId: string) {
        return this.prisma.linkPage.findMany({
            where: { userId },
            include: { items: { orderBy: { sortOrder: 'asc' } }, _count: { select: { clicks: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updatePage(userId: string, id: string, dto: Partial<CreateLinkPageDto>) {
        const page = await this.prisma.linkPage.findUnique({ where: { id } });
        if (!page) throw new NotFoundException();
        if (page.userId !== userId) throw new ForbiddenException();
        return this.prisma.linkPage.update({ where: { id }, data: dto, include: { items: true } });
    }

    async removePage(userId: string, id: string) {
        const page = await this.prisma.linkPage.findUnique({ where: { id } });
        if (!page) throw new NotFoundException();
        if (page.userId !== userId) throw new ForbiddenException();
        return this.prisma.linkPage.delete({ where: { id } });
    }

    // ── Public page (no auth) ────────────────────────────────────────────────
    getPublicPage(slug: string) {
        return this.prisma.linkPage.findUnique({
            where: { slug, published: true },
            select: { id: true, slug: true, title: true, bio: true, avatarUrl: true, items: { where: { active: true }, orderBy: { sortOrder: 'asc' } } },
        });
    }

    // ── Items ────────────────────────────────────────────────────────────────
    async addItem(userId: string, pageId: string, dto: CreateLinkItemDto) {
        const page = await this.prisma.linkPage.findUnique({ where: { id: pageId } });
        if (!page) throw new NotFoundException();
        if (page.userId !== userId) throw new ForbiddenException();
        const count = await this.prisma.linkItem.count({ where: { linkPageId: pageId } });
        return this.prisma.linkItem.create({ data: { linkPageId: pageId, label: dto.label, url: dto.url, active: dto.active ?? true, sortOrder: count } });
    }

    async removeItem(userId: string, pageId: string, itemId: string) {
        const page = await this.prisma.linkPage.findUnique({ where: { id: pageId } });
        if (!page || page.userId !== userId) throw new ForbiddenException();
        return this.prisma.linkItem.delete({ where: { id: itemId } });
    }

    // ── Click tracking ───────────────────────────────────────────────────────
    async recordClick(slug: string, itemId?: string, ip?: string) {
        const page = await this.prisma.linkPage.findUnique({ where: { slug } });
        if (!page) return;
        const ipHash = ip ? crypto.createHash('sha256').update(ip).digest('hex') : null;
        return this.prisma.linkClick.create({
            data: { linkPageId: page.id, linkItemId: itemId ?? null, ipHash },
        });
    }
}
