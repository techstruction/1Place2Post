import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto, InviteMemberDto, UpdateMemberRoleDto } from './dto/workspace.dto';

const MANAGE_ROLES = ['OWNER', 'ADMIN'];

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);
    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug,
        industry: dto.industry,
        ownerId: userId,
        members: { create: { userId, role: 'OWNER' } },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
  }

  async findMine(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: { select: { socialAccounts: true, members: true } },
          },
        },
      },
    });
    return memberships.map(m => ({ ...m.workspace, myRole: m.role }));
  }

  async findOne(workspaceId: string, userId: string) {
    await this.assertMember(workspaceId, userId);
    return this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { socialAccounts: true, posts: true } },
      },
    });
  }

  async invite(requesterId: string, workspaceId: string, dto: InviteMemberDto) {
    await this.assertRole(workspaceId, requesterId, MANAGE_ROLES);

    const invitee = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!invitee) throw new NotFoundException(`No user with email ${dto.email}`);

    const existing = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: invitee.id } },
    });
    if (existing) throw new ConflictException('User is already a workspace member');

    return this.prisma.workspaceMember.create({
      data: { workspaceId, userId: invitee.id, role: (dto.role as any) ?? 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async updateMemberRole(requesterId: string, workspaceId: string, targetUserId: string, dto: UpdateMemberRoleDto) {
    await this.assertRole(workspaceId, requesterId, ['OWNER']);
    if (dto.role === 'OWNER') throw new ForbiddenException('Ownership transfer requires admin action');

    const target = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
    if (!target) throw new NotFoundException('Member not found');

    return this.prisma.workspaceMember.update({
      where: { id: target.id },
      data: { role: dto.role as any },
    });
  }

  async removeMember(requesterId: string, workspaceId: string, targetUserId: string) {
    await this.assertRole(workspaceId, requesterId, MANAGE_ROLES);
    if (targetUserId === requesterId) throw new ForbiddenException('Cannot remove yourself');

    const target = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'OWNER') throw new ForbiddenException('Cannot remove workspace owner');

    return this.prisma.workspaceMember.delete({ where: { id: target.id } });
  }

  private async assertMember(workspaceId: string, userId: string) {
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!m) throw new ForbiddenException('Not a member of this workspace');
    return m;
  }

  private async assertRole(workspaceId: string, userId: string, roles: string[]) {
    const m = await this.assertMember(workspaceId, userId);
    if (!roles.includes(m.role)) {
      throw new ForbiddenException(`Requires one of: ${roles.join(', ')}`);
    }
    return m;
  }
}
