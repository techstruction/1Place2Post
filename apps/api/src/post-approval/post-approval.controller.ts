import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PostApprovalService } from './post-approval.service';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class DecideDto {
    @IsEnum(['APPROVED', 'REJECTED']) decision: 'APPROVED' | 'REJECTED';
    @IsOptional() @IsString() reason?: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class PostApprovalController {
    constructor(private readonly svc: PostApprovalService) { }

    @Post('posts/:id/request-approval')
    requestApproval(@Request() req, @Param('id') postId: string) {
        return this.svc.requestApproval(req.user.id, postId);
    }

    @Get('approvals')
    findMine(@Request() req) { return this.svc.findUserApprovals(req.user.id); }

    @Get('approvals/pending')
    findPending(@Request() req) { return this.svc.findPendingApprovals(req.user.id); }

    @Post('approvals/:id/decide')
    decide(@Request() req, @Param('id') id: string, @Body() dto: DecideDto) {
        return this.svc.decide(req.user.id, id, dto.decision, dto.reason);
    }
}
