import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SocialAccountService } from './social-account.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('social-accounts')
@UseGuards(JwtAuthGuard)
export class SocialAccountController {
    constructor(private readonly service: SocialAccountService) { }

    @Get()
    findAll(@Request() req) {
        return this.service.findAll(req.user.id);
    }

    @Post()
    create(@Request() req, @Body() dto: CreateSocialAccountDto) {
        return this.service.create(req.user.id, dto);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.service.remove(req.user.id, id);
    }
}
