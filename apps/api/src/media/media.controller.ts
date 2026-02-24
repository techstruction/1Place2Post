import { Controller, Get, Post, Delete, Param, UseGuards, Request, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaService } from './media.service';
import * as fs from 'fs';

// Ensure uploads directory exists
const UPLOAD_DIR = 'uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
    constructor(private readonly service: MediaService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: UPLOAD_DIR,
            filename: (req, file, cb) => {
                const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, unique + extname(file.originalname));
            },
        }),
    }))
    upload(
        @Request() req,
        @UploadedFile(new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50 MB
                new FileTypeValidator({ fileType: /image\/(jpeg|png|gif|webp)|video\/(mp4|quicktime)/ }),
            ],
        }))
        file: Express.Multer.File,
    ) {
        return this.service.saveUpload(req.user.id, file);
    }

    @Get()
    findAll(@Request() req) { return this.service.findAll(req.user.id); }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) { return this.service.remove(req.user.id, id); }
}
