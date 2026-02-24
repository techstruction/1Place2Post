import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadStatus } from '@prisma/client';

@Injectable()
export class LeadService {
    constructor(private prisma: PrismaService) { }

    findAll(userId: string) {
        return this.prisma.lead.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: {
                socialAccount: true,
                sourceMessage: true,
            },
        });
    }

    async updateStatus(userId: string, id: string, status: LeadStatus) {
        const lead = await this.prisma.lead.findUnique({ where: { id } });
        if (!lead) throw new NotFoundException('Lead not found');
        if (lead.userId !== userId) throw new ForbiddenException();

        return this.prisma.lead.update({
            where: { id },
            data: { status },
            include: {
                socialAccount: true,
                sourceMessage: true,
            },
        });
    }
}
