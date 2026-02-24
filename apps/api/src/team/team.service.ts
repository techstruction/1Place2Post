import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, InviteMemberDto } from './dto/team.dto';

@Injectable()
export class TeamService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: CreateTeamDto) {
        const team = await this.prisma.team.create({
            data: { name: dto.name, ownerId: userId, members: { create: { userId, role: 'OWNER' } } },
            include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
        });
        return team;
    }

    async findMine(userId: string) {
        const membership = await this.prisma.teamMember.findFirst({
            where: { userId },
            include: {
                team: { include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } } },
            },
        });
        return membership?.team ?? null;
    }

    async invite(requesterId: string, dto: InviteMemberDto) {
        const myMembership = await this.prisma.teamMember.findFirst({ where: { userId: requesterId, role: { in: ['OWNER', 'ADMIN'] } } });
        if (!myMembership) throw new ForbiddenException('Only team owners/admins can invite');

        const invitee = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!invitee) throw new NotFoundException(`No user with email ${dto.email}`);

        const existing = await this.prisma.teamMember.findUnique({ where: { teamId_userId: { teamId: myMembership.teamId, userId: invitee.id } } });
        if (existing) throw new ConflictException('User is already a team member');

        return this.prisma.teamMember.create({
            data: { teamId: myMembership.teamId, userId: invitee.id, role: 'MEMBER' },
            include: { user: { select: { id: true, name: true, email: true } } },
        });
    }

    async removeMember(requesterId: string, targetUserId: string) {
        const myMembership = await this.prisma.teamMember.findFirst({ where: { userId: requesterId, role: { in: ['OWNER', 'ADMIN'] } } });
        if (!myMembership) throw new ForbiddenException('Only team owners/admins can remove members');
        if (targetUserId === requesterId) throw new ForbiddenException('Cannot remove yourself');

        const target = await this.prisma.teamMember.findFirst({ where: { teamId: myMembership.teamId, userId: targetUserId } });
        if (!target) throw new NotFoundException('Member not found');

        return this.prisma.teamMember.delete({ where: { id: target.id } });
    }
}
