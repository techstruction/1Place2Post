import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { Platform } from '@prisma/client';

export class CreateTemplateDto {
    @IsString() name: string;
    @IsOptional() @IsString() description?: string;
    @IsString() content: string;
    @IsOptional() @IsArray() @IsString({ each: true }) hashtags?: string[];
    @IsOptional() @IsEnum(Platform) platform?: Platform;
}
