import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostStatus } from '@prisma/client';

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
                status: (dto.status as unknown as PostStatus) ?? PostStatus.DRAFT,
                scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
                seriesId: dto.seriesId,
                ...(dto.mediaAssetIds?.length && {
                    mediaAssets: {
                        create: dto.mediaAssetIds.map((id, index) => ({
                            mediaAsset: { connect: { id } },
                            sortOrder: index,
                        })),
                    },
                }),
            },
        });
    }

    findAll(userId: string) {
        return this.prisma.post.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { platforms: true, mediaAssets: { include: { mediaAsset: true }, orderBy: { sortOrder: 'asc' } } },
        });
    }

    async findOne(userId: string, id: string) {
        const post = await this.prisma.post.findUnique({
            where: { id },
            include: { platforms: true, mediaAssets: { include: { mediaAsset: true }, orderBy: { sortOrder: 'asc' } } },
        });
        if (!post) throw new NotFoundException('Post not found');
        if (post.userId !== userId) throw new ForbiddenException();
        return post;
    }

    async update(userId: string, id: string, dto: UpdatePostDto) {
        await this.findOne(userId, id);
        return this.prisma.post.update({
            where: { id },
            data: {
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.caption !== undefined && { caption: dto.caption }),
                ...(dto.hashtags !== undefined && { hashtags: dto.hashtags }),
                ...(dto.status !== undefined && { status: dto.status as unknown as PostStatus }),
                ...(dto.scheduledAt !== undefined && { scheduledAt: new Date(dto.scheduledAt) }),
                ...(dto.seriesId !== undefined && { seriesId: dto.seriesId }),
            },
        });
    }

    async remove(userId: string, id: string) {
        await this.findOne(userId, id);
        return this.prisma.post.delete({ where: { id } });
    }
}
