import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { TemplateService } from './template.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplateController {
    constructor(private readonly svc: TemplateService) { }

    @Post() create(@Request() req, @Body() dto: CreateTemplateDto) { return this.svc.create(req.user.id, dto); }
    @Get() findAll(@Request() req) { return this.svc.findAll(req.user.id); }
    @Get(':id') findOne(@Request() req, @Param('id') id: string) { return this.svc.findOne(req.user.id, id); }
    @Patch(':id') update(@Request() req, @Param('id') id: string, @Body() dto: Partial<CreateTemplateDto>) { return this.svc.update(req.user.id, id, dto); }
    @Delete(':id') remove(@Request() req, @Param('id') id: string) { return this.svc.remove(req.user.id, id); }

    @Post(':id/apply')
    apply(@Request() req, @Param('id') id: string) { return this.svc.apply(req.user.id, id); }
}
