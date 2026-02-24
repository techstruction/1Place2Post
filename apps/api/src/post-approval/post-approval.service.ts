import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostApprovalService {
    constructor(private prisma: PrismaService) { }

    /** Request approval for a DRAFT post */
    async requestApproval(userId: string, postId: string) {
        const post = await this.prisma.post.findUnique({ where: { id: postId }, include: { approval: true } });
        if (!post) throw new NotFoundException('Post not found');
        if (post.userId !== userId) throw new ForbiddenException();
        if (post.status !== 'DRAFT') throw new BadRequestException('Only DRAFT posts can be submitted for approval');
        if (post.approval) throw new BadRequestException('Approval already requested');

        const [updatedPost] = await this.prisma.$transaction([
            this.prisma.post.update({ where: { id: postId }, data: { status: 'PENDING_APPROVAL', approvalRequestedAt: new Date() } }),
            this.prisma.postApproval.create({ data: { postId, requestedById: userId } }),
        ]);
        return updatedPost;
    }

    /** List all pending approvals (for now: all posts the user submitted) */
    findUserApprovals(userId: string) {
        return this.prisma.postApproval.findMany({
            where: { requestedById: userId },
            include: { post: { select: { id: true, caption: true, status: true, scheduledAt: true } } },
            orderBy: { requestedAt: 'desc' },
        });
    }

    /** List approvals PENDING decision (for admins / team owners) */
    findPendingApprovals(userId: string) {
        return this.prisma.postApproval.findMany({
            where: { status: 'REQUESTED' },
            include: {
                post: { select: { id: true, caption: true, status: true, scheduledAt: true } },
                requestedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { requestedAt: 'desc' },
        });
    }

    /** Approve or reject an approval record */
    async decide(deciderId: string, approvalId: string, decision: 'APPROVED' | 'REJECTED', reason?: string) {
        const approval = await this.prisma.postApproval.findUnique({ where: { id: approvalId } });
        if (!approval) throw new NotFoundException('Approval not found');
        if (approval.status !== 'REQUESTED') throw new BadRequestException('Approval already decided');

        const newPostStatus = decision === 'APPROVED' ? 'SCHEDULED' : 'DRAFT';

        await this.prisma.$transaction([
            this.prisma.postApproval.update({
                where: { id: approvalId },
                data: { status: decision, decidedById: deciderId, decidedAt: new Date(), decisionReason: reason ?? null },
            }),
            this.prisma.post.update({
                where: { id: approval.postId },
                data: { status: newPostStatus, approvalDecidedAt: new Date() },
            }),
        ]);
        return { decision, postId: approval.postId, newPostStatus };
    }
}
