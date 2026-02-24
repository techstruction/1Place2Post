import { Controller, Get, Patch, Param, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { LeadService } from './lead.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeadStatus } from '@prisma/client';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadController {
    constructor(private readonly service: LeadService) { }

    @Get()
    findAll(@Request() req) {
        return this.service.findAll(req.user.id);
    }

    @Patch(':id/status')
    async updateStatus(
        @Request() req,
        @Param('id') id: string,
        @Body() body: { status: string }
    ) {
        if (!Object.values(LeadStatus).includes(body.status as LeadStatus)) {
            throw new BadRequestException('Invalid lead status');
        }
        return this.service.updateStatus(req.user.id, id, body.status as LeadStatus);
    }
}
