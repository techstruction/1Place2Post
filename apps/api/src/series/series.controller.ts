import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SeriesService } from './series.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('series')
@UseGuards(JwtAuthGuard)
export class SeriesController {
    constructor(private readonly service: SeriesService) { }

    @Post() create(@Request() req, @Body() dto: CreateSeriesDto) { return this.service.create(req.user.id, dto); }
    @Get() findAll(@Request() req) { return this.service.findAll(req.user.id); }
    @Patch(':id') update(@Request() req, @Param('id') id: string, @Body() dto: Partial<CreateSeriesDto>) { return this.service.update(req.user.id, id, dto); }
    @Delete(':id') remove(@Request() req, @Param('id') id: string) { return this.service.remove(req.user.id, id); }
}
