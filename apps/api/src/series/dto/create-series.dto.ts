import { IsString, IsOptional } from 'class-validator';

export class CreateSeriesDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    cadence?: string; // e.g. "weekly", "daily"
}
