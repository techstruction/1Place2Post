import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
    constructor(private prisma: PrismaService) { }

    create(userId: string, dto: CreatePostDto) {
        return this.prisma.post.create({
            data: {
                userId,
                caption: dto.caption,
                title: dto.title,
                hashtags: dto.hashtags ?? [],
                status: dto.status ?? 'DRAFT',
                scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
                seriesId: dto.seriesId,
            },
        });
    }

    findAll(userId: string) {
        return this.prisma.post.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { platforms: true, mediaFiles: true },
        });
    }

    async findOne(userId: string, id: string) {
        const post = await this.prisma.post.findUnique({
            where: { id },
            include: { platforms: true, mediaFiles: true },
        });
        if (!post) throw new NotFoundException('Post not found');
        if (post.userId !== userId) throw new ForbiddenException();
        return post;
    }

    async update(userId: string, id: string, dto: UpdatePostDto) {
        await this.findOne(userId, id); // ownership check
        return this.prisma.post.update({
            where: { id },
            data: {
                ...dto,
                scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
                hashtags: dto.hashtags ?? undefined,
            },
        });
    }

    async remove(userId: string, id: string) {
        await this.findOne(userId, id); // ownership check
        return this.prisma.post.delete({ where: { id } });
    }
}
