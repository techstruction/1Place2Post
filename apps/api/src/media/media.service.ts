import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaValidationService } from './media-validation.service';
import * as fs from 'fs';
import * as path from 'path';

const COMMON_PLATFORMS = ['INSTAGRAM', 'TWITTER', 'LINKEDIN', 'TIKTOK'];

@Injectable()
export class MediaService {
    constructor(
        private prisma: PrismaService,
        private validation: MediaValidationService,
    ) { }

    async saveUpload(userId: string, file: Express.Multer.File, folder?: string) {
        const urlPath = `/uploads/${file.filename}`;
        const asset = await this.prisma.mediaAsset.create({
            data: {
                userId,
                filename: file.filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                urlPath,
                folder: folder || 'root',
                tags: [],
            },
        });

        try {
            const filePath = path.join(process.cwd(), 'uploads', file.filename);
            const results = await this.validation.validate(filePath, file.size, COMMON_PLATFORMS);
            const validationTag = `validation:${results.map(r => `${r.platform}=${r.status}`).join(',')}`;
            await this.prisma.mediaAsset.update({
                where: { id: asset.id },
                data: { tags: { push: validationTag } },
            });
        } catch {
            // Validation error does not block the upload
        }

        return asset;
    }

    findAll(userId: string) {
        return this.prisma.mediaAsset.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async remove(userId: string, id: string) {
        const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
        if (!asset) throw new NotFoundException();
        if (asset.userId !== userId) throw new ForbiddenException();
        // Delete file from disk
        const filePath = path.join(process.cwd(), 'uploads', asset.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return this.prisma.mediaAsset.delete({ where: { id } });
    }

    async moveToFolder(userId: string, id: string, folder: string) {
        const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
        if (!asset) throw new NotFoundException();
        if (asset.userId !== userId) throw new ForbiddenException();

        return this.prisma.mediaAsset.update({
            where: { id },
            data: { folder: folder || 'root' },
        });
    }
}
