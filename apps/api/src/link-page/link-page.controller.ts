import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Ip, NotFoundException } from '@nestjs/common';
import { LinkPageService } from './link-page.service';
import { CreateLinkPageDto, CreateLinkItemDto } from './dto/link-page.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// ── Authenticated routes ─────────────────────────────────────────────────
@Controller('link-pages')
@UseGuards(JwtAuthGuard)
export class LinkPageController {
    constructor(private readonly service: LinkPageService) { }

    @Post() createPage(@Request() req, @Body() dto: CreateLinkPageDto) { return this.service.createPage(req.user.id, dto); }
    @Get() findAll(@Request() req) { return this.service.findAllPages(req.user.id); }
    @Patch(':id') updatePage(@Request() req, @Param('id') id: string, @Body() dto: Partial<CreateLinkPageDto>) { return this.service.updatePage(req.user.id, id, dto); }
    @Delete(':id') removePage(@Request() req, @Param('id') id: string) { return this.service.removePage(req.user.id, id); }

    @Post(':id/items') addItem(@Request() req, @Param('id') pageId: string, @Body() dto: CreateLinkItemDto) { return this.service.addItem(req.user.id, pageId, dto); }
    @Delete(':id/items/:itemId') removeItem(@Request() req, @Param('id') pageId: string, @Param('itemId') itemId: string) { return this.service.removeItem(req.user.id, pageId, itemId); }
}

// ── Public routes (no JWT) ───────────────────────────────────────────────
@Controller('l')
export class PublicLinkPageController {
    constructor(private readonly service: LinkPageService) { }

    @Get(':slug')
    async getPublicPage(@Param('slug') slug: string) {
        const page = await this.service.getPublicPage(slug);
        if (!page) throw new NotFoundException('Page not found or not published');
        return page;
    }

    @Post(':slug/click')
    recordClick(@Param('slug') slug: string, @Body() body: { itemId?: string }, @Ip() ip: string) {
        return this.service.recordClick(slug, body.itemId, ip);
    }
}
