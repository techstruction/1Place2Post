import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Platform, EngagementMetric } from '@prisma/client';

export class RecordEventDto {
    @IsEnum(Platform) platform: Platform;
    @IsEnum(EngagementMetric) metric: EngagementMetric;
    @IsInt() @Min(0) value: number;
    @IsOptional() @IsString() occurredAt?: string; // ISO date
}
