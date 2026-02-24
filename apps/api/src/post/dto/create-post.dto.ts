import {
    IsString,
    IsOptional,
    IsArray,
    IsEnum,
    IsDateString,
} from 'class-validator';
import { PostStatus } from '@prisma/client';

export class CreatePostDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsString()
    caption: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    hashtags?: string[];

    @IsOptional()
    @IsEnum(PostStatus)
    status?: PostStatus;

    @IsOptional()
    @IsDateString()
    scheduledAt?: string;

    @IsOptional()
    @IsString()
    seriesId?: string;
}
