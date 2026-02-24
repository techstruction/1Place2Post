import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class TemplateService {
    constructor(private prisma: PrismaService) { }

    create(userId: string, dto: CreateTemplateDto) {
        return this.prisma.template.create({ data: { userId, ...dto, hashtags: dto.hashtags ?? [] } });
    }

    findAll(userId: string) {
        return this.prisma.template.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    }

    async findOne(userId: string, id: string) {
        const t = await this.prisma.template.findUnique({ where: { id } });
        if (!t) throw new NotFoundException();
        if (t.userId !== userId) throw new ForbiddenException();
        return t;
    }

    async update(userId: string, id: string, dto: Partial<CreateTemplateDto>) {
        await this.findOne(userId, id);
        return this.prisma.template.update({ where: { id }, data: dto });
    }

    async remove(userId: string, id: string) {
        await this.findOne(userId, id);
        return this.prisma.template.delete({ where: { id } });
    }

    /** Returns a partial Post shape pre-filled from the template (not saved) */
    async apply(userId: string, id: string) {
        const t = await this.findOne(userId, id);
        return { caption: t.content, hashtags: t.hashtags, status: 'DRAFT', templateId: id };
    }
}
