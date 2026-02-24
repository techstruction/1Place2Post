import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SupportService } from './support.service';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CreateTicketDto {
    @IsString() @MinLength(3) @MaxLength(200) subject: string;
    @IsString() @MinLength(1) @MaxLength(5000) message: string;
}

class AddMessageDto {
    @IsString() @MinLength(1) @MaxLength(5000) message: string;
}

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
    constructor(private readonly svc: SupportService) { }

    @Post('tickets')
    create(@Request() req, @Body() dto: CreateTicketDto) {
        return this.svc.createTicket(req.user.id, dto.subject, dto.message);
    }

    @Get('tickets')
    findAll(@Request() req) { return this.svc.findAll(req.user.id); }

    @Get('tickets/:id')
    findOne(@Request() req, @Param('id') id: string) { return this.svc.findOne(req.user.id, id); }

    @Post('tickets/:id/messages')
    addMessage(@Request() req, @Param('id') id: string, @Body() dto: AddMessageDto) {
        return this.svc.addMessage(req.user.id, id, dto.message);
    }

    @Patch('tickets/:id/close')
    close(@Request() req, @Param('id') id: string) { return this.svc.closeTicket(req.user.id, id); }
}
