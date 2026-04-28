import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { Platform } from '@prisma/client';

export class CreateSocialAccountDto {
    @IsString()
    workspaceId: string;

    @IsEnum(Platform)
    platform: Platform;

    @IsString()
    platformId: string;

    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsString()
    displayName?: string;

    @IsString()
    accessToken: string;

    @IsOptional()
    @IsString()
    refreshToken?: string;

    @IsOptional()
    @IsString()
    tokenExpiry?: string; // ISO date string

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    scopes?: string[];
}
