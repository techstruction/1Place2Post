import {
    Injectable, NotFoundException, ForbiddenException, OnModuleInit, OnModuleDestroy, Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { OutgoingWebhookService } from '../outgoing-webhook/outgoing-webhook.service';
import { classifyError, isPermanent, retryDelayMs } from './error-classifier';

@Injectable()
export class PublishQueueService {
    private readonly log = new Logger(PublishQueueService.name);

    constructor(
        private prisma: PrismaService,
        private notifications: NotificationService,
        private webhooks: OutgoingWebhookService,
    ) { }

    /** Enqueue via BullMQ for millisecond-precision delayed scheduling.
     *  Falls back to Postgres polling queue if Redis is unavailable. */
    async enqueueBull(postId: string, platform: string, runAt?: Date): Promise<void> {
        try {
            const { Queue } = await import('bullmq');
            const queueName = `publish-${platform.toLowerCase()}`;
            const delayMs = runAt ? Math.max(0, runAt.getTime() - Date.now()) : 0;
            const q = new Queue(queueName, {
                connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
            });
            await q.add('publish', { postId, platform }, {
                delay: delayMs,
                attempts: 5,
                backoff: { type: 'exponential', delay: 2 * 60 * 1000 },
                removeOnComplete: 100,
                removeOnFail: 500,
                jobId: `post-${postId}-${platform}`,
            });
            await q.close();
        } catch (err: any) {
            // Redis unavailable — Postgres polling fallback will handle it
            this.log.warn(`BullMQ enqueue failed, falling back to Postgres queue: ${err.message}`);
            await this.enqueue(postId, runAt);
        }
    }

    /** Upsert a publish job for a post */
    async enqueue(postId: string, runAt?: Date) {
        const nextRunAt = runAt ?? new Date();
        return this.prisma.postPublishJob.upsert({
            where: { postId },
            create: { postId, nextRunAt, status: 'PENDING' },
            update: { nextRunAt, status: 'PENDING', attempts: 0, lockedAt: null, lastError: null },
        });
    }

    /** Cancel a pending/retry job */
    async cancel(postId: string) {
        const job = await this.prisma.postPublishJob.findUnique({ where: { postId } });
        if (!job) throw new NotFoundException('No publish job for this post');
        return this.prisma.postPublishJob.update({ where: { postId }, data: { status: 'CANCELLED' } });
    }

    /** List jobs for posts owned by a user */
    findForUser(userId: string, limit = 50) {
        return this.prisma.postPublishJob.findMany({
            where: { post: { userId } },
            include: { post: { select: { id: true, caption: true, status: true, scheduledAt: true } } },
            orderBy: { nextRunAt: 'asc' },
            take: limit,
        });
    }

    /** Create PENDING jobs for any SCHEDULED posts missing a job */
    async backfill(limit = 200) {
        const now = new Date();
        const scheduled = await this.prisma.post.findMany({
            where: { status: 'SCHEDULED', scheduledAt: { lte: now }, publishJob: null },
            take: limit,
            select: { id: true, scheduledAt: true },
        });
        for (const p of scheduled) {
            await this.enqueue(p.id, p.scheduledAt ?? now).catch(() => null);
        }
        return scheduled.length;
    }

    /** Unlock RUNNING jobs stuck longer than 15 min (safety hatch) */
    resetStaleLocks() {
        const cutoff = new Date(Date.now() - 15 * 60 * 1000);
        return this.prisma.postPublishJob.updateMany({
            where: { status: 'RUNNING', lockedAt: { lt: cutoff } },
            data: { status: 'RETRY', lockedAt: null },
        });
    }

    /** Main worker: pick up due PENDING/RETRY jobs and process them */
    async processJobs(concurrency = 5) {
        const now = new Date();
        // Lock rows: update status to RUNNING atomically
        const jobs = await this.prisma.postPublishJob.findMany({
            where: { status: { in: ['PENDING', 'RETRY'] }, nextRunAt: { lte: now }, lockedAt: null },
            take: concurrency,
            include: { post: { select: { id: true, userId: true, caption: true } } },
        });
        if (jobs.length === 0) return;

        for (const job of jobs) {
            // Lock
            await this.prisma.postPublishJob.update({ where: { id: job.id }, data: { status: 'RUNNING', lockedAt: new Date() } });
            await this.runJob(job);
        }
    }

    /** Process jobs for a specific platform — one platform's failure never blocks another. */
    async processJobsForPlatform(platform: string, concurrency = 3) {
        const now = new Date();
        const jobs = await this.prisma.postPublishJob.findMany({
            where: {
                status: { in: ['PENDING', 'RETRY'] },
                nextRunAt: { lte: now },
                lockedAt: null,
                post: {
                    platforms: {
                        some: { socialAccount: { platform: platform as any } },
                    },
                },
            },
            take: concurrency,
            include: { post: { select: { id: true, userId: true, caption: true } } },
        });
        if (jobs.length === 0) return 0;

        await this.prisma.postPublishJob.updateMany({
            where: { id: { in: jobs.map(j => j.id) } },
            data: { status: 'RUNNING', lockedAt: new Date() },
        });

        await Promise.allSettled(jobs.map(job => this.runJob(job)));
        return jobs.length;
    }

    /** Execute a single job: publish, handle success/failure. */
    private async runJob(job: any) {
        try {
            await this.mockPublish(job);
            await this.prisma.$transaction([
                this.prisma.postPublishJob.update({ where: { id: job.id }, data: { status: 'SUCCESS', lockedAt: null, lastError: null } }),
                this.prisma.post.update({ where: { id: job.postId }, data: { status: 'PUBLISHED', publishedAt: new Date() } }),
                this.prisma.postLog.create({ data: { postId: job.postId, type: 'INFO', message: 'Post published successfully (mock)' } }),
            ]);
            await this.notifications.notify(job.post.userId, 'PUBLISH_SUCCESS', '✅ Post published', `"${job.post.caption.slice(0, 60)}"`, { postId: job.postId });
            this.webhooks.fire(job.post.userId, 'post.published', { postId: job.postId });
            // Schedule post-publish verification (fire-and-forget — non-blocking)
            this.scheduleVerification(job).catch(e =>
                this.log.warn(`Verification schedule failed for job ${job.id}: ${e.message}`)
            );
        } catch (err: any) {
            const errorClass = classifyError({
                status: err?.response?.status ?? err?.status,
                code: err?.code,
                retryAfterSeconds: err?.response?.headers?.['retry-after']
                    ? parseInt(err.response.headers['retry-after'], 10)
                    : undefined,
            });

            const permanent = isPermanent(errorClass);
            const newAttempts = job.attempts + 1;
            const exhausted = permanent || newAttempts >= job.maxAttempts;

            // TOKEN_EXPIRED → BLOCKED (preserve the job, don't mark it failed)
            // Other permanent/exhausted → FAILED
            // Still retrying → RETRY
            const nextStatus = exhausted
                ? (errorClass === 'TOKEN_EXPIRED' ? 'BLOCKED' : 'FAILED')
                : 'RETRY';

            const retryAfterSeconds = err?.response?.headers?.['retry-after']
                ? parseInt(err.response.headers['retry-after'], 10)
                : undefined;
            const backoffMs = exhausted ? 0 : retryDelayMs(errorClass, newAttempts, retryAfterSeconds);

            await this.prisma.$transaction([
                this.prisma.postPublishJob.update({
                    where: { id: job.id },
                    data: {
                        status: nextStatus,
                        attempts: newAttempts,
                        lockedAt: null,
                        lastError: err.message,
                        errorClass,
                        nextRunAt: exhausted ? new Date() : new Date(Date.now() + backoffMs),
                    },
                }),
                this.prisma.post.update({
                    where: { id: job.postId },
                    data: {
                        status: nextStatus === 'BLOCKED' ? 'SCHEDULED' : (exhausted ? 'FAILED' : 'SCHEDULED'),
                    },
                }),
                this.prisma.postLog.create({
                    data: {
                        postId: job.postId,
                        type: 'ERROR',
                        message: `Publish ${nextStatus} (attempt ${newAttempts}/${job.maxAttempts}) [${errorClass}]: ${err.message}`,
                    },
                }),
            ]);

            if (nextStatus === 'FAILED') {
                await this.notifications.notify(
                    job.post.userId, 'PUBLISH_FAILED', '❌ Post publish failed',
                    `Gave up after ${job.maxAttempts} attempts [${errorClass}]. Last error: ${err.message}`,
                    { postId: job.postId },
                );
            }
            if (nextStatus === 'BLOCKED') {
                await this.notifications.notify(
                    job.post.userId, 'PUBLISH_BLOCKED', '🔒 Post blocked — account needs reconnection',
                    'A post could not be published because the connected account token has expired. Reconnect your account to unblock.',
                    { postId: job.postId },
                );
            }
            this.log.error(`Job ${job.id} → ${nextStatus} [${errorClass}] (attempt ${newAttempts}): ${err.message}`);
        }
    }

    /** Mock publisher — always succeeds. Phase 6 replaces this with real platform API calls. */
    private async mockPublish(job: any) {
        // Simulate 50ms processing delay
        await new Promise(r => setTimeout(r, 50));
        // Uncomment to test failure path: throw new Error('Platform rate limit (mock)');
    }

    private scheduleVerification(job: any): Promise<void> {
        return new Promise<void>(resolve => {
            setTimeout(async () => {
                try {
                    const verified = await this.verifyPublished(job);
                    if (!verified) {
                        await this.prisma.postPublishJob.update({
                            where: { id: job.id },
                            data: { status: 'VERIFY_FAILED' },
                        });
                        await this.notifications.notify(
                            job.post.userId,
                            'PUBLISH_VERIFY_FAILED',
                            '⚠️ Post may not have published',
                            'Your post was sent to the platform but could not be confirmed as visible. Check your account directly.',
                            { postId: job.postId },
                        );
                    }
                } catch (e: any) {
                    this.log.warn(`Post-publish verification error for job ${job.id}: ${e.message}`);
                }
                resolve();
            }, 30_000);
        });
    }

    protected async verifyPublished(_job: any): Promise<boolean> {
        // Base implementation trusts the 2xx response (mock mode).
        // Real platform services override this per platform.
        return true;
    }
}
