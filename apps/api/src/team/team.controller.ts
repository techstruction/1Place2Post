import { Controller, Get, Post, Body, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { TeamService } from './team.service';
import { CreateTeamDto, InviteMemberDto } from './dto/team.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamController {
    constructor(private readonly svc: TeamService) { }

    @Post() create(@Request() req, @Body() dto: CreateTeamDto) { return this.svc.create(req.user.id, dto); }
    @Get('mine') findMine(@Request() req) { return this.svc.findMine(req.user.id); }
    @Post('members') invite(@Request() req, @Body() dto: InviteMemberDto) { return this.svc.invite(req.user.id, dto); }
    @Delete('members/:userId') remove(@Request() req, @Param('userId') uid: string) { return this.svc.removeMember(req.user.id, uid); }
}
