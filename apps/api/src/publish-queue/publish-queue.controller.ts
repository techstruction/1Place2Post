import { Controller, Get, Post, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { PublishQueueService } from './publish-queue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class PublishQueueController {
    constructor(private readonly svc: PublishQueueService) { }

    @Get()
    list(@Request() req, @Query('limit') limit?: string) {
        return this.svc.findForUser(req.user.id, limit ? +limit : 50);
    }

    @Post('publish/:postId')
    enqueue(@Param('postId') postId: string, @Body() body: { runAt?: string }) {
        return this.svc.enqueue(postId, body.runAt ? new Date(body.runAt) : undefined);
    }

    @Post('cancel/:postId')
    cancel(@Param('postId') postId: string) {
        return this.svc.cancel(postId);
    }

    @Post('reset-failed-locks')
    resetLocks() {
        return this.svc.resetStaleLocks();
    }
}
