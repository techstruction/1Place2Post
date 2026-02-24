import {
    IsString,
    IsOptional,
    IsArray,
    IsEnum,
    IsDateString,
} from 'class-validator';

// Mirror of Prisma's PostStatus enum — avoids runtime null from @prisma/client
export enum PostStatus {
    DRAFT = 'DRAFT',
    SCHEDULED = 'SCHEDULED',
    PUBLISHING = 'PUBLISHING',
    PUBLISHED = 'PUBLISHED',
    FAILED = 'FAILED',
    ARCHIVED = 'ARCHIVED',
}

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
