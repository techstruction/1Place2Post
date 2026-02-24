import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateLinkPageDto {
    @IsString()
    slug: string;

    @IsString()
    title: string;

    @IsOptional() @IsString() bio?: string;
    @IsOptional() @IsString() avatarUrl?: string;
    @IsOptional() @IsBoolean() published?: boolean;
}

export class CreateLinkItemDto {
    @IsString() label: string;
    @IsString() url: string;
    @IsOptional() @IsBoolean() active?: boolean;
}
