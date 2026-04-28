import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { TelegramService, ConnectTelegramDto } from './telegram.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IsString } from 'class-validator';

class ConnectTelegramBody {
    @IsString() botToken: string;
    @IsString() channelUsername: string;
    @IsString() workspaceId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('social/telegram')
export class TelegramController {
    constructor(private readonly telegramService: TelegramService) {}

    @Post('connect')
    connect(@Req() req: any, @Body() body: ConnectTelegramBody) {
        return this.telegramService.connectChannel(req.user.id, body as ConnectTelegramDto);
    }
}
