import {
  Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto, InviteMemberDto, UpdateMemberRoleDto } from './dto/workspace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateWorkspaceDto) {
    return this.workspaceService.create(req.user.id, dto);
  }

  @Get('mine')
  findMine(@Req() req: any) {
    return this.workspaceService.findMine(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.workspaceService.findOne(id, req.user.id);
  }

  @Post(':id/members')
  invite(@Req() req: any, @Param('id') id: string, @Body() dto: InviteMemberDto) {
    return this.workspaceService.invite(req.user.id, id, dto);
  }

  @Patch(':id/members/:userId')
  updateRole(
    @Req() req: any,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspaceService.updateMemberRole(req.user.id, id, userId, dto);
  }

  @Delete(':id/members/:userId')
  removeMember(@Req() req: any, @Param('id') id: string, @Param('userId') userId: string) {
    return this.workspaceService.removeMember(req.user.id, id, userId);
  }
}
