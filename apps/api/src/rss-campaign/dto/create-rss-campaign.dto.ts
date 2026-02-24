import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateRssCampaignDto {
    @IsString() name: string;
    @IsUrl() rssUrl: string;
    @IsOptional() @IsString() template?: string;
    @IsOptional() @IsString() socialAccountId?: string;
}
