import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSeriesDto } from './dto/create-series.dto';

@Injectable()
export class SeriesService {
    constructor(private prisma: PrismaService) { }

    create(userId: string, dto: CreateSeriesDto) {
        return this.prisma.series.create({ data: { userId, ...dto } });
    }

    findAll(userId: string) {
        return this.prisma.series.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    }

    async update(userId: string, id: string, dto: Partial<CreateSeriesDto>) {
        const s = await this.prisma.series.findUnique({ where: { id } });
        if (!s) throw new NotFoundException();
        if (s.userId !== userId) throw new ForbiddenException();
        return this.prisma.series.update({ where: { id }, data: dto });
    }

    async remove(userId: string, id: string) {
        const s = await this.prisma.series.findUnique({ where: { id } });
        if (!s) throw new NotFoundException();
        if (s.userId !== userId) throw new ForbiddenException();
        return this.prisma.series.delete({ where: { id } });
    }
}
