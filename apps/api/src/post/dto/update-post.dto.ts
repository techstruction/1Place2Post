import { IsString, IsOptional, IsArray, IsEnum, IsDateString } from 'class-validator';
import { PostStatus } from './create-post.dto';

export class UpdatePostDto {
    @IsOptional() @IsString() title?: string;
    @IsOptional() @IsString() caption?: string;
    @IsOptional() @IsArray() @IsString({ each: true }) hashtags?: string[];
    @IsOptional() @IsEnum(PostStatus) status?: PostStatus;
    @IsOptional() @IsDateString() scheduledAt?: string;
    @IsOptional() @IsString() seriesId?: string;
}
