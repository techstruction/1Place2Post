import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber } from 'class-validator';

export enum BotMatchType {
    CONTAINS = 'CONTAINS',
    REGEX = 'REGEX',
    ANY = 'ANY',
}

export class CreateBotRuleDto {
    @IsString() name: string;
    @IsEnum(BotMatchType) matchType: BotMatchType;
    @IsString() matchValue: string;
    @IsString() replyText: string;
    @IsOptional() @IsString() webhookUrl?: string;
    @IsOptional() @IsBoolean() active?: boolean;
    @IsOptional() @IsString() triggerType?: string;
    @IsOptional() @IsString() platform?: string;
    @IsOptional() @IsString() socialAccountId?: string;
    @IsOptional() @IsString() replyMode?: string;
    @IsOptional() @IsNumber() cooldownSeconds?: number;
}
