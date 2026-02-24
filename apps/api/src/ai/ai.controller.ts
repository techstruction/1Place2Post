import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Platform } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class GenerateCaptionDto {
    @IsString() topic: string;
    @IsEnum(Platform) platform: Platform;
    @IsOptional() @IsString() tone?: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(private readonly svc: AiService) { }

    @Post('generate-caption')
    generate(@Body() dto: GenerateCaptionDto) {
        return this.svc.generateCaption(dto.topic, dto.platform, dto.tone);
    }
}
