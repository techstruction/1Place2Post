import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';

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
}
