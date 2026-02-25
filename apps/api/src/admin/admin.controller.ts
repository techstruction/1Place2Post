import {
    Controller, Get, Patch, Delete, Param, Body, Request, UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('stats')
    stats() { return this.adminService.getStats(); }

    @Get('health')
    health() { return this.adminService.getHealth(); }

    @Get('users')
    listUsers() { return this.adminService.listUsers(); }

    @Patch('users/:id')
    async updateUser(
        @Param('id') id: string,
        @Body() body: { role?: string; name?: string },
        @Request() req,
    ) {
        const result = await this.adminService.updateUser(id, body);
        await this.adminService.logAction(req.user.id, 'USER_UPDATED', id, JSON.stringify(body));
        return result;
    }

    @Delete('users/:id')
    async deleteUser(@Param('id') id: string, @Request() req) {
        await this.adminService.logAction(req.user.id, 'USER_DELETED', id);
        return this.adminService.deleteUser(id);
    }

    @Get('audit-logs')
    auditLogs() { return this.adminService.getAuditLogs(); }

    @Get('flags')
    flags() { return this.adminService.getFlags(); }

    @Patch('flags/:key')
    async setFlag(@Param('key') key: string, @Body() body: { enabled: boolean }, @Request() req) {
        const result = await this.adminService.setFlag(key, body.enabled);
        await this.adminService.logAction(req.user.id, 'FLAG_TOGGLED', key, String(body.enabled));
        return result;
    }
}
