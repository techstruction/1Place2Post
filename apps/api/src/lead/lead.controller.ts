import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { LeadService } from './lead.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeadStatus } from '@prisma/client';
import { z } from 'zod';

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
        const schema = z.object({
            status: z.nativeEnum(LeadStatus),
        });
        const input = schema.parse(body);
        return this.service.updateStatus(req.user.id, id, input.status);
    }
}
