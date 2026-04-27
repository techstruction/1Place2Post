import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TokenStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

const WARNING_DAYS = 7;
const CRITICAL_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class TokenHealthService {
  private readonly log = new Logger(TokenHealthService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  /**
   * Pure static method — computes the token status given an expiry date and a
   * reference "now".  Static so unit tests can call it without DI.
   */
  static computeStatus(tokenExpiry: Date | null, now: Date = new Date()): TokenStatus {
    if (tokenExpiry === null) return TokenStatus.ACTIVE;

    const msUntilExpiry = tokenExpiry.getTime() - now.getTime();

    if (msUntilExpiry < 0) return TokenStatus.TOKEN_EXPIRED;
    if (msUntilExpiry < CRITICAL_DAYS * MS_PER_DAY) return TokenStatus.TOKEN_CRITICAL;
    if (msUntilExpiry < WARNING_DAYS * MS_PER_DAY) return TokenStatus.TOKEN_EXPIRING;
    return TokenStatus.ACTIVE;
  }

  /** Runs every 4 hours. */
  @Cron('0 */4 * * *')
  async runHealthCheck(): Promise<void> {
    this.log.log('Token health check starting');

    const accounts = await this.prisma.socialAccount.findMany({
      where: { tokenStatus: { not: TokenStatus.DISCONNECTED } },
      select: {
        id: true,
        userId: true,
        platform: true,
        tokenExpiry: true,
        tokenStatus: true,
      },
    });

    const now = new Date();
    let changed = 0;

    for (const account of accounts) {
      const newStatus = TokenHealthService.computeStatus(account.tokenExpiry, now);

      // Skip if status hasn't changed — avoids notification spam
      if (newStatus === account.tokenStatus) continue;

      await this.prisma.socialAccount.update({
        where: { id: account.id },
        data: { tokenStatus: newStatus },
      });

      changed++;

      if (newStatus === TokenStatus.TOKEN_EXPIRING) {
        const daysLeft = account.tokenExpiry
          ? Math.ceil((account.tokenExpiry.getTime() - now.getTime()) / MS_PER_DAY)
          : null;

        await this.notifications.notify(
          account.userId,
          'TOKEN_EXPIRING',
          `${account.platform} token expiring soon`,
          `Your ${account.platform} connection will expire in ~${daysLeft} days. Reconnect to keep publishing.`,
          { socialAccountId: account.id, platform: account.platform },
        );
      } else if (newStatus === TokenStatus.TOKEN_CRITICAL) {
        const daysLeft = account.tokenExpiry
          ? Math.ceil((account.tokenExpiry.getTime() - now.getTime()) / MS_PER_DAY)
          : null;

        await this.notifications.notify(
          account.userId,
          'TOKEN_CRITICAL',
          `${account.platform} token expires in ${daysLeft} day(s)!`,
          `Urgent: your ${account.platform} connection expires very soon. Reconnect now to avoid blocked posts.`,
          { socialAccountId: account.id, platform: account.platform },
        );
      } else if (newStatus === TokenStatus.TOKEN_EXPIRED) {
        await this.notifications.notify(
          account.userId,
          'TOKEN_EXPIRED',
          `${account.platform} token has expired`,
          `Your ${account.platform} connection has expired. Pending posts have been blocked — reconnect to unblock them.`,
          { socialAccountId: account.id, platform: account.platform },
        );

        try {
          const blocked = await this.blockJobsForExpiredAccount(account.id);
          if (blocked > 0) {
            this.log.warn(`Blocked ${blocked} job(s) for expired account ${account.id} (${account.platform})`);
          }
        } catch (err: any) {
          this.log.error(`Failed to block jobs for expired account ${account.id}: ${err.message}`);
        }
      }
    }

    this.log.log(`Token health check complete — ${accounts.length} accounts checked, ${changed} status change(s)`);
  }

  /**
   * Finds all PENDING or RETRY PostPublishJobs whose Post targets this social
   * account (via PostPlatform) and marks them BLOCKED.
   * Returns the count of blocked jobs.
   */
  private async blockJobsForExpiredAccount(socialAccountId: string): Promise<number> {
    // Get all postIds that target this socialAccount
    const postPlatforms = await this.prisma.postPlatform.findMany({
      where: { socialAccountId },
      select: { postId: true },
    });

    const postIds = postPlatforms.map((pp) => pp.postId);
    if (postIds.length === 0) return 0;

    const result = await this.prisma.postPublishJob.updateMany({
      where: {
        postId: { in: postIds },
        status: { in: ['PENDING', 'RETRY'] },
      },
      data: {
        status: 'BLOCKED',
        errorClass: 'TOKEN_EXPIRED',
        lastError: 'Account token expired — reconnect to unblock',
      },
    });

    return result.count;
  }

  /**
   * Call this when a user successfully reconnects a social account.
   * Resets tokenStatus to ACTIVE and re-queues all previously BLOCKED jobs.
   * Returns the count of unblocked jobs.
   */
  async unblockJobsForAccount(socialAccountId: string): Promise<number> {
    // Reset the account status
    await this.prisma.socialAccount.update({
      where: { id: socialAccountId },
      data: { tokenStatus: TokenStatus.ACTIVE },
    });

    // Find all posts targeting this account
    const postPlatforms = await this.prisma.postPlatform.findMany({
      where: { socialAccountId },
      select: { postId: true },
    });

    const postIds = postPlatforms.map((pp) => pp.postId);
    if (postIds.length === 0) return 0;

    const result = await this.prisma.postPublishJob.updateMany({
      where: {
        postId: { in: postIds },
        status: 'BLOCKED',
      },
      data: {
        status: 'PENDING',
        errorClass: null,
        lastError: null,
        nextRunAt: new Date(),
      },
    });

    return result.count;
  }
}
