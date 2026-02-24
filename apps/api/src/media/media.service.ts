import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MediaService {
    constructor(private prisma: PrismaService) { }

    async saveUpload(userId: string, file: Express.Multer.File) {
        const urlPath = `/uploads/${file.filename}`;
        return this.prisma.mediaAsset.create({
            data: {
                userId,
                filename: file.filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                urlPath,
                tags: [],
            },
        });
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
}
