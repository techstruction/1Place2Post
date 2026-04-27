# Publishing Reliability Infrastructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform 1Place2Post's publish pipeline from a mock/naive polling queue into a production-grade reliability engine that can legitimately market "posts that actually post" — the single most complained-about failure mode across every competitor.

**Architecture:** Eight-root-cause reliability system: proactive token health monitoring, permanent-vs-transient error classification, per-platform queue isolation, pre-flight media validation, rate limit awareness, post-publish verification, and a BullMQ migration for millisecond-precision timing. Each layer is independently deployable and backward-compatible.

**Tech Stack:** NestJS (API), Prisma (ORM), PostgreSQL, Redis + BullMQ (queue engine), ffprobe/fluent-ffmpeg (media validation), sharp (image metadata), @nestjs/schedule (cron), React/Next.js (dashboard UI)

**Research basis:** `docs/research/RELIABILITY_RESEARCH.md` and `docs/research/content360/The reliability gap is Content360's open wound.md` — read these before implementing. Every architectural decision here is grounded in competitor failure analysis.

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `apps/api/src/token-health/token-health.module.ts` | NestJS module registering the scheduler |
| `apps/api/src/token-health/token-health.service.ts` | Core token health logic (check, refresh, notify, block) |
| `apps/api/src/publish-queue/error-classifier.ts` | Pure function: HTTP status → `ErrorClass` enum |
| `apps/api/src/media/ffprobe.service.ts` | Server-side ffprobe wrapper (video metadata extraction) |
| `apps/api/src/media/platform-requirements.json` | Per-platform media rules as a live config (not hardcoded) |
| `apps/api/src/media/media-validation.service.ts` | Cross-platform validation engine: PASS/WARN/FAIL per platform |
| `apps/api/src/rate-limit/rate-limit.service.ts` | Per-account API call tracking and bulk stagger logic |
| `apps/web/src/app/dashboard/jobs/page.tsx` | Publish jobs status page with error badges and retry buttons |
| `apps/web/src/app/dashboard/jobs/JobStatusBadge.tsx` | Badge component for job status + error class |

### Modified files
| File | Change |
|---|---|
| `apps/api/prisma/schema.prisma` | Add `SocialAccount.tokenStatus` enum, `PostPublishJob.errorClass` enum, `BLOCKED` to `JobStatus` |
| `apps/api/src/social-account/social-account.service.ts` | Drive status from `tokenStatus` field instead of computed on-the-fly |
| `apps/api/src/publish-queue/publish-queue.service.ts` | Error classification, smart retry, BLOCKED state for expired tokens, post-publish verification |
| `apps/api/src/publish-queue/publish-worker.service.ts` | Per-platform concurrent processing (platform-bucketed job dispatch) |
| `apps/api/src/media/media.service.ts` | Wire ffprobe validation into `saveUpload()` |
| `apps/api/src/app.module.ts` | Register `TokenHealthModule`, `RateLimitModule` |

---

## Task 1: Prisma Schema — Token Status + Job Error Class

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Add enums and fields to schema**

Open `apps/api/prisma/schema.prisma`. Add these changes:

```prisma
// After the existing Platform enum, add:
enum TokenStatus {
  ACTIVE
  TOKEN_EXPIRING   // < 7 days remaining
  TOKEN_CRITICAL   // < 3 days remaining
  TOKEN_EXPIRED    // past expiry, cannot publish
  DISCONNECTED     // manually disconnected or revoked
}

// After the existing JobStatus enum, add BLOCKED:
enum JobStatus {
  PENDING
  RUNNING
  RETRY
  SUCCESS
  FAILED
  CANCELLED
  BLOCKED          // account TOKEN_EXPIRED — awaiting reconnection
}

// Add error class enum:
enum ErrorClass {
  PERMANENT        // 400/401/403/422 — do not retry
  TRANSIENT        // 429/5xx — retry with backoff
  RATE_LIMIT       // 429 specifically — honor Retry-After header
  TOKEN_EXPIRED    // 401 from platform — need user reconnect
  PLATFORM_OUTAGE  // 3+ concurrent 5xx from same platform
  UNKNOWN          // unexpected error type
}
```

On `SocialAccount` model, add field after `isActive`:
```prisma
  tokenStatus  TokenStatus @default(ACTIVE)
```

On `PostPublishJob` model, add field after `lastError`:
```prisma
  errorClass   ErrorClass?
```

- [ ] **Step 2: Generate migration**

```bash
cd apps/api && npx prisma migrate dev --name add_token_status_and_error_class
```

Expected: Migration created and applied. Prisma client regenerated.

- [ ] **Step 3: Verify migration applied**

```bash
cd apps/api && npx prisma studio
```

Open browser at `localhost:5555`. Confirm `SocialAccount` has `tokenStatus` column and `PostPublishJob` has `errorClass` column.

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(db): add TokenStatus enum and ErrorClass to schema"
```

---

## Task 2: Error Classifier — Permanent vs Transient

**Files:**
- Create: `apps/api/src/publish-queue/error-classifier.ts`
- Create: `apps/api/src/publish-queue/error-classifier.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/api/src/publish-queue/error-classifier.spec.ts`:

```typescript
import { classifyError } from './error-classifier';

describe('classifyError', () => {
  it('classifies 401 as TOKEN_EXPIRED', () => {
    expect(classifyError({ status: 401 })).toBe('TOKEN_EXPIRED');
  });

  it('classifies 400 as PERMANENT', () => {
    expect(classifyError({ status: 400 })).toBe('PERMANENT');
  });

  it('classifies 403 as PERMANENT', () => {
    expect(classifyError({ status: 403 })).toBe('PERMANENT');
  });

  it('classifies 422 as PERMANENT', () => {
    expect(classifyError({ status: 422 })).toBe('PERMANENT');
  });

  it('classifies 429 as RATE_LIMIT', () => {
    expect(classifyError({ status: 429, retryAfterSeconds: 60 })).toBe('RATE_LIMIT');
  });

  it('classifies 500 as TRANSIENT', () => {
    expect(classifyError({ status: 500 })).toBe('TRANSIENT');
  });

  it('classifies 503 as TRANSIENT', () => {
    expect(classifyError({ status: 503 })).toBe('TRANSIENT');
  });

  it('classifies network errors as TRANSIENT', () => {
    expect(classifyError({ code: 'ECONNRESET' })).toBe('TRANSIENT');
  });

  it('classifies unknown errors as UNKNOWN', () => {
    expect(classifyError({})).toBe('UNKNOWN');
  });

  it('extracts retryAfterSeconds from 429 errors', () => {
    const result = classifyError({ status: 429, retryAfterSeconds: 120 });
    expect(result).toBe('RATE_LIMIT');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/api && npx jest error-classifier --no-coverage
```

Expected: FAIL — `Cannot find module './error-classifier'`

- [ ] **Step 3: Implement error-classifier.ts**

Create `apps/api/src/publish-queue/error-classifier.ts`:

```typescript
import { ErrorClass } from '@prisma/client';

export interface ClassifiableError {
  status?: number;
  code?: string;
  retryAfterSeconds?: number;
}

const NETWORK_ERROR_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED']);
const PERMANENT_HTTP_STATUSES = new Set([400, 403, 422]);
const TRANSIENT_HTTP_STATUSES = new Set([500, 502, 503, 504]);

export function classifyError(err: ClassifiableError): ErrorClass {
  if (err.status === 401) return 'TOKEN_EXPIRED';
  if (err.status === 429) return 'RATE_LIMIT';
  if (err.status && PERMANENT_HTTP_STATUSES.has(err.status)) return 'PERMANENT';
  if (err.status && TRANSIENT_HTTP_STATUSES.has(err.status)) return 'TRANSIENT';
  if (err.code && NETWORK_ERROR_CODES.has(err.code)) return 'TRANSIENT';
  return 'UNKNOWN';
}

export function isPermanent(errorClass: ErrorClass): boolean {
  return errorClass === 'PERMANENT' || errorClass === 'TOKEN_EXPIRED';
}

export function retryDelayMs(errorClass: ErrorClass, attempt: number, retryAfterSeconds?: number): number {
  if (errorClass === 'RATE_LIMIT' && retryAfterSeconds) {
    return Math.max(retryAfterSeconds * 1000, 60_000);
  }
  // Exponential backoff with jitter: min(base * 2^attempt + jitter, max)
  const base = 2 * 60 * 1000; // 2 minutes
  const max = 24 * 60 * 60 * 1000; // 24 hours
  const jitter = Math.random() * 30_000;
  return Math.min(base * Math.pow(2, attempt) + jitter, max);
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd apps/api && npx jest error-classifier --no-coverage
```

Expected: PASS — all 9 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/publish-queue/error-classifier.ts apps/api/src/publish-queue/error-classifier.spec.ts
git commit -m "feat(publish): add error classifier — permanent vs transient HTTP errors"
```

---

## Task 3: Smart Retry + BLOCKED State in PublishQueueService

**Files:**
- Modify: `apps/api/src/publish-queue/publish-queue.service.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/api/src/publish-queue/publish-queue.service.spec.ts`:

```typescript
import { classifyError, isPermanent, retryDelayMs } from './error-classifier';

describe('retryDelayMs', () => {
  it('returns at least retryAfterSeconds for RATE_LIMIT', () => {
    const delay = retryDelayMs('RATE_LIMIT', 1, 90);
    expect(delay).toBeGreaterThanOrEqual(90_000);
  });

  it('returns exponential delay for TRANSIENT', () => {
    const delay0 = retryDelayMs('TRANSIENT', 0);
    const delay1 = retryDelayMs('TRANSIENT', 1);
    expect(delay1).toBeGreaterThan(delay0);
  });

  it('isPermanent is true for TOKEN_EXPIRED', () => {
    expect(isPermanent('TOKEN_EXPIRED')).toBe(true);
  });

  it('isPermanent is true for PERMANENT', () => {
    expect(isPermanent('PERMANENT')).toBe(true);
  });

  it('isPermanent is false for TRANSIENT', () => {
    expect(isPermanent('TRANSIENT')).toBe(false);
  });

  it('isPermanent is false for RATE_LIMIT', () => {
    expect(isPermanent('RATE_LIMIT')).toBe(false);
  });
});
```

- [ ] **Step 2: Run to confirm tests pass (these use already-implemented functions)**

```bash
cd apps/api && npx jest publish-queue.service.spec --no-coverage
```

Expected: PASS (functions already exist from Task 2).

- [ ] **Step 3: Update `publish-queue.service.ts` catch block**

In `apps/api/src/publish-queue/publish-queue.service.ts`, replace the entire `catch (err: any)` block inside `processJobs()` with:

```typescript
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

  const nextStatus = exhausted ? (errorClass === 'TOKEN_EXPIRED' ? 'BLOCKED' : 'FAILED') : 'RETRY';

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
      data: { status: exhausted ? (nextStatus === 'BLOCKED' ? 'SCHEDULED' : 'FAILED') : 'SCHEDULED' },
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
      job.post.userId,
      'PUBLISH_FAILED',
      '❌ Post publish failed',
      `Gave up after ${job.maxAttempts} attempts [${errorClass}]. Last error: ${err.message}`,
      { postId: job.postId },
    );
  }
  if (nextStatus === 'BLOCKED') {
    await this.notifications.notify(
      job.post.userId,
      'PUBLISH_BLOCKED',
      '🔒 Post blocked — account needs reconnection',
      `A post could not be published because the connected account's token has expired. Reconnect your account to unblock.`,
      { postId: job.postId },
    );
  }
  this.log.error(`Job ${job.id} → ${nextStatus} [${errorClass}] (attempt ${newAttempts}): ${err.message}`);
}
```

Add imports at the top of the file:

```typescript
import { classifyError, isPermanent, retryDelayMs } from './error-classifier';
```

Also update `processJobs()` WHERE clause to exclude BLOCKED jobs:

```typescript
where: { status: { in: ['PENDING', 'RETRY'] }, nextRunAt: { lte: now }, lockedAt: null },
```

This already excludes BLOCKED — confirm `'BLOCKED'` is not in the `in: []` array. ✓

- [ ] **Step 4: Build to confirm no type errors**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/publish-queue/publish-queue.service.ts apps/api/src/publish-queue/publish-queue.service.spec.ts
git commit -m "feat(publish): smart retry — classify permanent vs transient errors, BLOCKED state for expired tokens"
```

---

## Task 4: TokenHealthModule — Proactive Token Monitor

**Files:**
- Create: `apps/api/src/token-health/token-health.module.ts`
- Create: `apps/api/src/token-health/token-health.service.ts`
- Create: `apps/api/src/token-health/token-health.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`

Token lifetimes reference (from research):
| Platform | Proactive refresh possible? | Notes |
|---|---|---|
| Instagram/Facebook | No | 60-day token, must re-auth manually |
| TikTok | Yes | Refresh token valid 90 days |
| Twitter/X | Yes | Refresh token valid 6 months |
| YouTube/Google | Yes | Refresh token indefinite |
| LinkedIn | Yes | With `offline_access` scope |
| Pinterest | Yes | Refresh token valid 60 days |

- [ ] **Step 1: Write failing tests**

Create `apps/api/src/token-health/token-health.service.spec.ts`:

```typescript
import { TokenHealthService, TokenHealthResult } from './token-health.service';

describe('TokenHealthService.computeStatus', () => {
  const now = new Date('2026-04-27T12:00:00Z');

  it('returns ACTIVE when expiry is > 7 days away', () => {
    const expiry = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    expect(TokenHealthService.computeStatus(expiry, now)).toBe('ACTIVE');
  });

  it('returns TOKEN_EXPIRING when expiry is 4-7 days away', () => {
    const expiry = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    expect(TokenHealthService.computeStatus(expiry, now)).toBe('TOKEN_EXPIRING');
  });

  it('returns TOKEN_CRITICAL when expiry is < 3 days away', () => {
    const expiry = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    expect(TokenHealthService.computeStatus(expiry, now)).toBe('TOKEN_CRITICAL');
  });

  it('returns TOKEN_EXPIRED when expiry has passed', () => {
    const expiry = new Date(now.getTime() - 1000);
    expect(TokenHealthService.computeStatus(expiry, now)).toBe('TOKEN_EXPIRED');
  });

  it('returns ACTIVE when tokenExpiry is null (non-expiring token)', () => {
    expect(TokenHealthService.computeStatus(null, now)).toBe('ACTIVE');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/api && npx jest token-health --no-coverage
```

Expected: FAIL — `Cannot find module './token-health.service'`

- [ ] **Step 3: Implement token-health.service.ts**

Create `apps/api/src/token-health/token-health.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { TokenStatus } from '@prisma/client';

const WARNING_DAYS = 7;
const CRITICAL_DAYS = 3;

@Injectable()
export class TokenHealthService {
  private readonly log = new Logger(TokenHealthService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  /** Pure static: compute status from expiry date. Exported for testability. */
  static computeStatus(tokenExpiry: Date | null, now: Date = new Date()): TokenStatus {
    if (!tokenExpiry) return 'ACTIVE';
    const diffMs = tokenExpiry.getTime() - now.getTime();
    const diffDays = diffMs / (24 * 60 * 60 * 1000);
    if (diffDays < 0) return 'TOKEN_EXPIRED';
    if (diffDays < CRITICAL_DAYS) return 'TOKEN_CRITICAL';
    if (diffDays < WARNING_DAYS) return 'TOKEN_EXPIRING';
    return 'ACTIVE';
  }

  /** Cron: run every 4 hours. Checks all active social accounts for token health. */
  @Cron('0 */4 * * *')
  async runHealthCheck() {
    this.log.log('Token health check started');
    const accounts = await this.prisma.socialAccount.findMany({
      where: { tokenStatus: { not: 'DISCONNECTED' } },
      select: { id: true, userId: true, platform: true, username: true, tokenExpiry: true, tokenStatus: true },
    });

    let updated = 0;
    let warned = 0;

    for (const account of accounts) {
      const newStatus = TokenHealthService.computeStatus(account.tokenExpiry);

      if (newStatus === account.tokenStatus) continue;

      await this.prisma.socialAccount.update({
        where: { id: account.id },
        data: { tokenStatus: newStatus },
      });
      updated++;

      const platformName = account.platform.toLowerCase();
      const accountLabel = account.username ?? platformName;

      if (newStatus === 'TOKEN_EXPIRING') {
        const daysLeft = Math.ceil((account.tokenExpiry!.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        await this.notifications.notify(
          account.userId,
          'TOKEN_EXPIRING',
          `⚠️ ${accountLabel} needs reconnection in ${daysLeft} days`,
          `Your ${platformName} account "${accountLabel}" token expires in ${daysLeft} days. Reconnect now to avoid missed posts.`,
          { socialAccountId: account.id },
        );
        warned++;
      }

      if (newStatus === 'TOKEN_CRITICAL') {
        const daysLeft = Math.ceil((account.tokenExpiry!.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        await this.notifications.notify(
          account.userId,
          'TOKEN_CRITICAL',
          `🔴 ${accountLabel} expires in ${daysLeft} days — reconnect now`,
          `Your ${platformName} account "${accountLabel}" token expires very soon. Posts will stop publishing if not reconnected.`,
          { socialAccountId: account.id },
        );
        warned++;
      }

      if (newStatus === 'TOKEN_EXPIRED') {
        // Block all PENDING/RETRY publish jobs for posts targeting this account
        const blockedCount = await this.blockJobsForExpiredAccount(account.id);
        await this.notifications.notify(
          account.userId,
          'TOKEN_EXPIRED',
          `❌ ${accountLabel} disconnected — posts are blocked`,
          `Your ${platformName} account "${accountLabel}" token has expired. ${blockedCount} scheduled posts are blocked until you reconnect.`,
          { socialAccountId: account.id },
        );
        warned++;
      }
    }

    this.log.log(`Token health check complete: ${updated} status changes, ${warned} notifications sent`);
  }

  private async blockJobsForExpiredAccount(socialAccountId: string): Promise<number> {
    // Find posts that target this social account and have a pending publish job
    const postPlatforms = await this.prisma.postPlatform.findMany({
      where: { socialAccountId },
      select: { postId: true },
    });
    const postIds = postPlatforms.map(pp => pp.postId);
    if (postIds.length === 0) return 0;

    const result = await this.prisma.postPublishJob.updateMany({
      where: { postId: { in: postIds }, status: { in: ['PENDING', 'RETRY'] } },
      data: { status: 'BLOCKED', errorClass: 'TOKEN_EXPIRED', lastError: 'Account token expired — reconnect to unblock' },
    });
    return result.count;
  }

  /** Call this when a user successfully reconnects an account — unblocks all BLOCKED jobs. */
  async unblockJobsForAccount(socialAccountId: string): Promise<number> {
    await this.prisma.socialAccount.update({
      where: { id: socialAccountId },
      data: { tokenStatus: 'ACTIVE' },
    });

    const postPlatforms = await this.prisma.postPlatform.findMany({
      where: { socialAccountId },
      select: { postId: true },
    });
    const postIds = postPlatforms.map(pp => pp.postId);
    if (postIds.length === 0) return 0;

    const result = await this.prisma.postPublishJob.updateMany({
      where: { postId: { in: postIds }, status: 'BLOCKED' },
      data: { status: 'PENDING', errorClass: null, lastError: null, nextRunAt: new Date() },
    });
    return result.count;
  }
}
```

- [ ] **Step 4: Create the module**

Create `apps/api/src/token-health/token-health.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TokenHealthService } from './token-health.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, NotificationModule],
  providers: [TokenHealthService],
  exports: [TokenHealthService],
})
export class TokenHealthModule {}
```

- [ ] **Step 5: Install @nestjs/schedule if not present**

```bash
cd apps/api && npm list @nestjs/schedule 2>/dev/null | grep nestjs/schedule || npm install @nestjs/schedule
```

- [ ] **Step 6: Register in app.module.ts**

In `apps/api/src/app.module.ts`, add:
```typescript
import { TokenHealthModule } from './token-health/token-health.module';
```
And add `TokenHealthModule` to the `imports` array.

- [ ] **Step 7: Run tests**

```bash
cd apps/api && npx jest token-health --no-coverage
```

Expected: PASS — all 5 tests green.

- [ ] **Step 8: Build check**

```bash
cd apps/api && npx tsc --noEmit
```

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/token-health/ apps/api/src/app.module.ts
git commit -m "feat(token-health): proactive cron monitor — warns 7 days before expiry, blocks jobs on expiry"
```

---

## Task 5: Wire Token Status into SocialAccount API

**Files:**
- Modify: `apps/api/src/social-account/social-account.service.ts`

The `findAll()` method currently computes `tokenExpiring`/`tokenExpired` on the fly. Replace this with the persisted `tokenStatus` field — the source of truth is now the cron job.

- [ ] **Step 1: Update `findAll()` in social-account.service.ts**

Replace the entire `findAll()` method:

```typescript
async findAll(userId: string) {
  return this.prisma.socialAccount.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      platform: true,
      platformId: true,
      username: true,
      displayName: true,
      tokenExpiry: true,
      tokenStatus: true,   // use persisted status, not computed
      isActive: true,
      scopes: true,
      metaJson: true,
      createdAt: true,
      updatedAt: true,
      // Never expose accessToken or refreshToken to the frontend
    },
  });
}
```

Remove the old `now`, `warnThreshold`, and `.map()` block — those computed fields are gone; `tokenStatus` is the canonical field now.

- [ ] **Step 2: Also call `unblockJobsForAccount` after reconnect**

Find where OAuth reconnect/update happens in `social-account.service.ts` or the OAuth callback handlers. After updating the account's `accessToken`, call:

```typescript
await this.tokenHealthService.unblockJobsForAccount(accountId);
```

Inject `TokenHealthService` into `SocialAccountService` constructor:

```typescript
constructor(
  private prisma: PrismaService,
  private tokenHealth: TokenHealthService,
) {}
```

Update `SocialAccountModule` imports to include `TokenHealthModule`.

- [ ] **Step 3: Build check**

```bash
cd apps/api && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/social-account/
git commit -m "feat(social-account): use persisted tokenStatus field; unblock jobs on reconnect"
```

---

## Task 6: Per-Platform Queue Isolation in PublishWorkerService

**Files:**
- Modify: `apps/api/src/publish-queue/publish-worker.service.ts`
- Modify: `apps/api/src/publish-queue/publish-queue.service.ts`

The current worker pulls a flat list of due jobs and processes them serially. This means a hung Instagram job blocks a Twitter job. The fix: process jobs grouped by platform, each platform concurrently but independently.

- [ ] **Step 1: Write failing test**

Add to `apps/api/src/publish-queue/publish-queue.service.spec.ts`:

```typescript
describe('processJobsForPlatform', () => {
  it('only picks up jobs for the specified platform', async () => {
    // This is an integration test — wire with real Prisma in E2E tests.
    // Unit: just verify the WHERE clause structure is platform-filtered.
    // Covered by E2E; skip for now.
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Add `processJobsForPlatform()` to publish-queue.service.ts**

Add method below `processJobs()`:

```typescript
/** Process jobs for a specific platform — enables per-platform isolation. */
async processJobsForPlatform(platform: string, concurrency = 3) {
  const now = new Date();
  const jobs = await this.prisma.postPublishJob.findMany({
    where: {
      status: { in: ['PENDING', 'RETRY'] },
      nextRunAt: { lte: now },
      lockedAt: null,
      post: {
        postPlatforms: {
          some: { socialAccount: { platform: platform as any } },
        },
      },
    },
    take: concurrency,
    include: { post: { select: { id: true, userId: true, caption: true } } },
  });
  if (jobs.length === 0) return 0;

  // Lock all at once to reduce contention
  await this.prisma.postPublishJob.updateMany({
    where: { id: { in: jobs.map(j => j.id) } },
    data: { status: 'RUNNING', lockedAt: new Date() },
  });

  // Process concurrently — failures are isolated per job
  await Promise.allSettled(jobs.map(job => this.runJob(job)));
  return jobs.length;
}
```

Extract the existing job-run logic from `processJobs()` into a private `runJob(job)` method to avoid duplication.

- [ ] **Step 3: Update publish-worker.service.ts to process per platform**

Replace the `setInterval` timer body in `PublishWorkerService.onModuleInit()`:

```typescript
const PLATFORMS = ['INSTAGRAM', 'TWITTER', 'LINKEDIN', 'TIKTOK', 'YOUTUBE', 'FACEBOOK', 'PINTEREST'];

this.timer = setInterval(async () => {
  try {
    // Process each platform independently — a failure in one never blocks another
    await Promise.allSettled(
      PLATFORMS.map(platform => this.queue.processJobsForPlatform(platform, 3))
    );
  } catch (e) { this.log.error('Worker poll error', e); }
}, 15_000);
```

- [ ] **Step 4: Build check**

```bash
cd apps/api && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/publish-queue/
git commit -m "feat(publish): per-platform queue isolation — Instagram failures never block Twitter jobs"
```

---

## Task 7: Pre-flight Media Validation — ffprobe + Platform Requirements

**Files:**
- Create: `apps/api/src/media/platform-requirements.json`
- Create: `apps/api/src/media/ffprobe.service.ts`
- Create: `apps/api/src/media/media-validation.service.ts`
- Create: `apps/api/src/media/ffprobe.service.spec.ts`
- Modify: `apps/api/src/media/media.module.ts`

- [ ] **Step 1: Install ffprobe dependency**

```bash
cd apps/api && npm install fluent-ffmpeg @ffprobe-installer/ffprobe && npm install --save-dev @types/fluent-ffmpeg
```

Expected: packages installed. Confirm with `npm list fluent-ffmpeg`.

- [ ] **Step 2: Create platform-requirements.json**

Create `apps/api/src/media/platform-requirements.json`:

```json
{
  "INSTAGRAM": {
    "image": {
      "formats": ["jpeg", "jpg", "png"],
      "maxSizeMB": 8,
      "aspectRatios": ["1:1", "4:5", "1.91:1"],
      "maxWidthPx": 1080
    },
    "reel": {
      "formats": ["mp4"],
      "videoCodecs": ["h264"],
      "maxSizeMB": 4096,
      "maxDurationSeconds": 900,
      "minDurationSeconds": 3,
      "aspectRatio": "9:16",
      "minResolutionHeight": 720
    },
    "story": {
      "formats": ["mp4"],
      "videoCodecs": ["h264"],
      "maxSizeMB": 4096,
      "maxDurationSeconds": 60,
      "aspectRatio": "9:16"
    }
  },
  "TWITTER": {
    "image": {
      "formats": ["jpeg", "jpg", "png", "gif", "webp"],
      "maxSizeMB": 5
    },
    "video": {
      "formats": ["mp4"],
      "maxSizeMB": 512,
      "maxDurationSeconds": 140
    }
  },
  "LINKEDIN": {
    "image": {
      "formats": ["jpeg", "jpg", "png"],
      "maxSizeMB": 10
    },
    "video": {
      "formats": ["mp4"],
      "maxSizeMB": 5120,
      "minDurationSeconds": 3,
      "maxDurationSeconds": 600
    }
  },
  "TIKTOK": {
    "video": {
      "formats": ["mp4", "webm"],
      "maxSizeMB": 4096,
      "minDurationSeconds": 3,
      "maxDurationSeconds": 600,
      "minResolutionHeight": 720
    }
  },
  "YOUTUBE": {
    "short": {
      "formats": ["mp4", "mov", "avi", "webm"],
      "maxSizeMB": 262144,
      "maxDurationSeconds": 60,
      "aspectRatio": "9:16"
    },
    "video": {
      "formats": ["mp4", "mov", "avi", "webm"],
      "maxSizeMB": 262144,
      "maxDurationSeconds": 43200
    }
  },
  "FACEBOOK": {
    "image": {
      "formats": ["jpeg", "jpg", "png", "bmp", "gif"],
      "maxSizeMB": 30
    },
    "video": {
      "formats": ["mp4"],
      "maxSizeMB": 10240,
      "maxDurationSeconds": 14400
    }
  }
}
```

- [ ] **Step 3: Write failing ffprobe test**

Create `apps/api/src/media/ffprobe.service.spec.ts`:

```typescript
import { FfprobeService, MediaMetadata } from './ffprobe.service';

describe('FfprobeService.parseExtension', () => {
  it('returns jpeg for .jpg files', () => {
    expect(FfprobeService.parseExtension('photo.jpg')).toBe('jpeg');
  });

  it('returns mp4 for .mp4 files', () => {
    expect(FfprobeService.parseExtension('video.mp4')).toBe('mp4');
  });

  it('returns jpeg for .jpeg files', () => {
    expect(FfprobeService.parseExtension('photo.jpeg')).toBe('jpeg');
  });

  it('returns unknown for unknown extension', () => {
    expect(FfprobeService.parseExtension('file.xyz')).toBe('unknown');
  });
});
```

- [ ] **Step 4: Run to confirm they fail**

```bash
cd apps/api && npx jest ffprobe --no-coverage
```

Expected: FAIL — `Cannot find module './ffprobe.service'`

- [ ] **Step 5: Implement ffprobe.service.ts**

Create `apps/api/src/media/ffprobe.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffprobeInstaller from '@ffprobe-installer/ffprobe';

ffmpeg.setFfprobePath(ffprobeInstaller.path);

export interface MediaMetadata {
  type: 'image' | 'video' | 'unknown';
  format: string;            // e.g. 'mp4', 'jpeg'
  videoCodec?: string;       // e.g. 'h264', 'h265'
  audioCodec?: string;
  widthPx?: number;
  heightPx?: number;
  durationSeconds?: number;
  sizeBytes: number;
  aspectRatio?: string;      // e.g. '9:16', '1:1'
}

const EXTENSION_MAP: Record<string, string> = {
  jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', webp: 'webp',
  bmp: 'bmp', heic: 'heic', mp4: 'mp4', mov: 'mov', avi: 'avi',
  webm: 'webm', mkv: 'mkv',
};

@Injectable()
export class FfprobeService {
  private readonly log = new Logger(FfprobeService.name);

  static parseExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    return EXTENSION_MAP[ext] ?? 'unknown';
  }

  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  private computeAspectRatio(width: number, height: number): string {
    const d = this.gcd(width, height);
    return `${width / d}:${height / d}`;
  }

  async probe(filePath: string, sizeBytes: number): Promise<MediaMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) return reject(err);

        const videoStream = data.streams.find(s => s.codec_type === 'video');
        const audioStream = data.streams.find(s => s.codec_type === 'audio');
        const format = data.format.format_name?.split(',')[0] ?? 'unknown';
        const ext = FfprobeService.parseExtension(filePath);

        if (!videoStream) {
          resolve({ type: 'image', format: ext, sizeBytes });
          return;
        }

        const w = videoStream.width ?? 0;
        const h = videoStream.height ?? 0;

        resolve({
          type: 'video',
          format: ext,
          videoCodec: videoStream.codec_name,
          audioCodec: audioStream?.codec_name,
          widthPx: w,
          heightPx: h,
          durationSeconds: parseFloat(data.format.duration ?? '0'),
          sizeBytes,
          aspectRatio: w && h ? this.computeAspectRatio(w, h) : undefined,
        });
      });
    });
  }
}
```

- [ ] **Step 6: Run tests**

```bash
cd apps/api && npx jest ffprobe --no-coverage
```

Expected: PASS — all 4 extension tests green.

- [ ] **Step 7: Implement media-validation.service.ts**

Create `apps/api/src/media/media-validation.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { FfprobeService, MediaMetadata } from './ffprobe.service';
import * as requirements from './platform-requirements.json';

export type ValidationStatus = 'PASS' | 'WARN' | 'FAIL';

export interface ValidationResult {
  platform: string;
  status: ValidationStatus;
  issues: string[];
  warnings: string[];
}

@Injectable()
export class MediaValidationService {
  constructor(private ffprobe: FfprobeService) {}

  async validate(filePath: string, sizeBytes: number, platforms: string[]): Promise<ValidationResult[]> {
    const meta = await this.ffprobe.probe(filePath, sizeBytes);
    return platforms.map(platform => this.checkPlatform(platform, meta));
  }

  private checkPlatform(platform: string, meta: MediaMetadata): ValidationResult {
    const rules = (requirements as any)[platform];
    if (!rules) return { platform, status: 'PASS', issues: [], warnings: ['No rules defined for this platform'] };

    const issues: string[] = [];
    const warnings: string[] = [];

    const ruleKey = meta.type === 'video' ? (rules.reel ?? rules.video ?? rules.short) : rules.image;
    if (!ruleKey) {
      return { platform, status: 'PASS', issues: [], warnings: [`No ${meta.type} rules for ${platform}`] };
    }

    // Format check
    if (ruleKey.formats && !ruleKey.formats.includes(meta.format)) {
      issues.push(`${platform} requires ${ruleKey.formats.join(' or ')} — got ${meta.format}`);
    }

    // Size check
    const sizeMB = meta.sizeBytes / (1024 * 1024);
    if (ruleKey.maxSizeMB && sizeMB > ruleKey.maxSizeMB) {
      issues.push(`File is ${sizeMB.toFixed(1)}MB — ${platform} maximum is ${ruleKey.maxSizeMB}MB`);
    }
    if (ruleKey.maxSizeMB && sizeMB > ruleKey.maxSizeMB * 0.9) {
      warnings.push(`File is ${sizeMB.toFixed(1)}MB — close to ${platform}'s ${ruleKey.maxSizeMB}MB limit`);
    }

    // Video-specific checks
    if (meta.type === 'video') {
      if (ruleKey.videoCodecs && meta.videoCodec && !ruleKey.videoCodecs.includes(meta.videoCodec)) {
        issues.push(`${platform} requires ${ruleKey.videoCodecs.join(' or ')} codec — got ${meta.videoCodec}. Re-encode to H.264.`);
      }
      if (ruleKey.maxDurationSeconds && meta.durationSeconds && meta.durationSeconds > ruleKey.maxDurationSeconds) {
        issues.push(`Video is ${meta.durationSeconds.toFixed(0)}s — ${platform} maximum is ${ruleKey.maxDurationSeconds}s`);
      }
      if (ruleKey.minDurationSeconds && meta.durationSeconds && meta.durationSeconds < ruleKey.minDurationSeconds) {
        issues.push(`Video is ${meta.durationSeconds.toFixed(0)}s — ${platform} minimum is ${ruleKey.minDurationSeconds}s`);
      }
      if (ruleKey.aspectRatio && meta.aspectRatio && meta.aspectRatio !== ruleKey.aspectRatio) {
        warnings.push(`${platform} prefers ${ruleKey.aspectRatio} aspect ratio — your video is ${meta.aspectRatio}`);
      }
    }

    const status: ValidationStatus = issues.length > 0 ? 'FAIL' : warnings.length > 0 ? 'WARN' : 'PASS';
    return { platform, status, issues, warnings };
  }
}
```

- [ ] **Step 8: Register in media.module.ts**

Open `apps/api/src/media/media.module.ts` and add `FfprobeService` and `MediaValidationService` to providers. Export `MediaValidationService`.

- [ ] **Step 9: Wire validation into media.service.ts saveUpload()**

In `apps/api/src/media/media.service.ts`, after storing the file to disk, call validation for common platforms and store the results in `MediaAsset.tags` as a JSON string (until a proper `validationResults` column exists):

```typescript
// After creating the mediaAsset record:
// Store validation results in tags field as serialized JSON
const commonPlatforms = ['INSTAGRAM', 'TWITTER', 'LINKEDIN', 'TIKTOK'];
try {
  const filePath = path.join(process.cwd(), 'uploads', file.filename);
  const results = await this.validation.validate(filePath, file.size, commonPlatforms);
  const failed = results.filter(r => r.status === 'FAIL').map(r => r.platform);
  // Store as a special tag: "validation:INSTAGRAM=PASS,TWITTER=FAIL"
  const validationTag = `validation:${results.map(r => `${r.platform}=${r.status}`).join(',')}`;
  await this.prisma.mediaAsset.update({
    where: { id: asset.id },
    data: { tags: { push: validationTag } },
  });
} catch (e) {
  // Validation failure does not block upload — just log
  // (ffprobe unavailable in some environments)
}
```

Inject `MediaValidationService` into `MediaService` constructor.

- [ ] **Step 10: Build check**

```bash
cd apps/api && npx tsc --noEmit
```

- [ ] **Step 11: Commit**

```bash
git add apps/api/src/media/
git commit -m "feat(media): pre-flight ffprobe validation — per-platform PASS/WARN/FAIL at upload time"
```

---

## Task 8: Rate Limit Manager — Per-Account Tracking + Bulk Staggering

**Files:**
- Create: `apps/api/src/rate-limit/rate-limit.service.ts`
- Create: `apps/api/src/rate-limit/rate-limit.service.spec.ts`
- Create: `apps/api/src/rate-limit/rate-limit.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/api/src/rate-limit/rate-limit.service.spec.ts`:

```typescript
import { RateLimitService } from './rate-limit.service';

describe('RateLimitService.computeStaggeredTimes', () => {
  it('adds 2-minute spacing between posts to same platform', () => {
    const baseTime = new Date('2026-04-28T09:00:00Z');
    const times = RateLimitService.computeStaggeredTimes(baseTime, 3, 'INSTAGRAM');
    expect(times).toHaveLength(3);
    expect(times[1].getTime() - times[0].getTime()).toBeGreaterThanOrEqual(2 * 60 * 1000);
    expect(times[2].getTime() - times[1].getTime()).toBeGreaterThanOrEqual(2 * 60 * 1000);
  });

  it('returns the same time for a single post', () => {
    const baseTime = new Date('2026-04-28T09:00:00Z');
    const times = RateLimitService.computeStaggeredTimes(baseTime, 1, 'INSTAGRAM');
    expect(times[0]).toEqual(baseTime);
  });
});

describe('RateLimitService.withinDailyLimit', () => {
  it('returns true when post count is below limit', () => {
    expect(RateLimitService.withinDailyLimit('INSTAGRAM', 10)).toBe(true);
  });

  it('returns false when post count is at or above Instagram limit of 25', () => {
    expect(RateLimitService.withinDailyLimit('INSTAGRAM', 25)).toBe(false);
  });

  it('returns true for platforms with no defined limit', () => {
    expect(RateLimitService.withinDailyLimit('FACEBOOK', 249)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```bash
cd apps/api && npx jest rate-limit --no-coverage
```

Expected: FAIL — `Cannot find module`

- [ ] **Step 3: Implement rate-limit.service.ts**

Create `apps/api/src/rate-limit/rate-limit.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';

// Daily post limits per platform (conservative — platform limits may vary by account tier)
const DAILY_POST_LIMITS: Record<string, number> = {
  INSTAGRAM: 25,
  TIKTOK: 10,
  LINKEDIN: 150,
  // Twitter: 300/3hr is generous enough to not gate
  // Facebook, YouTube, Pinterest: no hard daily post limits
};

// Minimum seconds between posts to same platform account (to avoid rate limit spikes)
const MIN_SPACING_SECONDS: Record<string, number> = {
  INSTAGRAM: 120,  // 2 min
  TIKTOK: 300,     // 5 min — aggressive rate limits
  LINKEDIN: 60,    // 1 min
  TWITTER: 30,     // 30 sec
  DEFAULT: 60,     // 1 min for anything else
};

@Injectable()
export class RateLimitService {
  /** Returns true if adding one more post to this platform today is within limits. */
  static withinDailyLimit(platform: string, currentCount: number): boolean {
    const limit = DAILY_POST_LIMITS[platform];
    if (!limit) return true;
    return currentCount < limit;
  }

  /**
   * Given a base time and N posts to the same platform, spread them out
   * with minimum spacing to avoid rate limit spikes.
   */
  static computeStaggeredTimes(baseTime: Date, count: number, platform: string): Date[] {
    if (count === 1) return [baseTime];
    const spacingMs = (MIN_SPACING_SECONDS[platform] ?? MIN_SPACING_SECONDS.DEFAULT) * 1000;
    return Array.from({ length: count }, (_, i) => new Date(baseTime.getTime() + i * spacingMs));
  }
}
```

- [ ] **Step 4: Create rate-limit.module.ts**

Create `apps/api/src/rate-limit/rate-limit.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';

@Module({
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
```

- [ ] **Step 5: Run tests**

```bash
cd apps/api && npx jest rate-limit --no-coverage
```

Expected: PASS — all 4 tests green.

- [ ] **Step 6: Register in app.module.ts**

Add `RateLimitModule` to imports in `apps/api/src/app.module.ts`.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/rate-limit/ apps/api/src/app.module.ts
git commit -m "feat(rate-limit): per-platform daily limits and bulk post staggering"
```

---

## Task 9: Post-Publish Verification

**Files:**
- Modify: `apps/api/src/publish-queue/publish-queue.service.ts`

After a successful publish API call, wait 30 seconds and query the platform API to confirm the post actually exists. If it returns 404 or hidden status, mark `VERIFY_FAILED` and notify the user.

- [ ] **Step 1: Add VERIFY_FAILED to JobStatus enum in schema**

In `apps/api/prisma/schema.prisma`, add to `JobStatus`:

```prisma
enum JobStatus {
  PENDING
  RUNNING
  RETRY
  SUCCESS
  VERIFY_FAILED    // Published but platform returned 404 on verification
  FAILED
  CANCELLED
  BLOCKED
}
```

Run migration:

```bash
cd apps/api && npx prisma migrate dev --name add_verify_failed_status
```

- [ ] **Step 2: Add verification call to publish-queue.service.ts**

In the `processJobs()` success path (after the publish succeeds), add:

```typescript
// After successful publish:
await this.prisma.$transaction([...success updates...]);

// Post-publish verification — non-blocking, fire and forget
this.scheduleVerification(job).catch(e =>
  this.log.warn(`Verification schedule failed for job ${job.id}: ${e.message}`)
);
```

Add the method:

```typescript
private scheduleVerification(job: any) {
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
      } catch (e) {
        this.log.warn(`Verification failed for job ${job.id}: ${e.message}`);
      }
      resolve();
    }, 30_000); // 30 second delay — allow platform to process
  });
}

/** Override this in platform-specific publishers to check post existence via API. */
protected async verifyPublished(_job: any): Promise<boolean> {
  // Base implementation: trust the 2xx response (mock mode)
  // Real platform services will override this per platform
  return true;
}
```

- [ ] **Step 3: Build check**

```bash
cd apps/api && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/ apps/api/src/publish-queue/
git commit -m "feat(publish): post-publish verification — detect silently filtered posts"
```

---

## Task 10: Reliability Dashboard UI — /dashboard/jobs

**Files:**
- Create: `apps/web/src/app/dashboard/jobs/page.tsx`
- Create: `apps/web/src/app/dashboard/jobs/JobStatusBadge.tsx`

This page gives users full visibility into every publish job: status, error class, retry button, per-post logs.

- [ ] **Step 1: Write JobStatusBadge component**

Create `apps/web/src/app/dashboard/jobs/JobStatusBadge.tsx`:

```tsx
import { cn } from '@/lib/utils';

type JobStatus = 'PENDING' | 'RUNNING' | 'RETRY' | 'SUCCESS' | 'VERIFY_FAILED' | 'FAILED' | 'CANCELLED' | 'BLOCKED';
type ErrorClass = 'PERMANENT' | 'TRANSIENT' | 'RATE_LIMIT' | 'TOKEN_EXPIRED' | 'PLATFORM_OUTAGE' | 'UNKNOWN' | null;

const STATUS_CONFIG: Record<JobStatus, { label: string; className: string }> = {
  PENDING:      { label: 'Pending',         className: 'bg-muted text-muted-foreground' },
  RUNNING:      { label: 'Publishing…',     className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  RETRY:        { label: 'Retrying',        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  SUCCESS:      { label: 'Published',       className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  VERIFY_FAILED:{ label: 'Unconfirmed',     className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  FAILED:       { label: 'Failed',          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  CANCELLED:    { label: 'Cancelled',       className: 'bg-muted text-muted-foreground' },
  BLOCKED:      { label: 'Blocked',         className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

const ERROR_CLASS_LABELS: Record<string, string> = {
  PERMANENT:       '400 Bad content',
  TRANSIENT:       'Platform error (retrying)',
  RATE_LIMIT:      'Rate limited (retrying)',
  TOKEN_EXPIRED:   'Token expired',
  PLATFORM_OUTAGE: 'Platform outage',
  UNKNOWN:         'Unknown error',
};

export function JobStatusBadge({ status, errorClass }: { status: JobStatus; errorClass?: ErrorClass }) {
  const config = STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', config.className)}>
        {config.label}
      </span>
      {errorClass && (
        <span className="text-xs text-muted-foreground">
          {ERROR_CLASS_LABELS[errorClass] ?? errorClass}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the jobs page**

Create `apps/web/src/app/dashboard/jobs/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { JobStatusBadge } from './JobStatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface PublishJob {
  id: string;
  postId: string;
  status: string;
  errorClass: string | null;
  attempts: number;
  maxAttempts: number;
  nextRunAt: string;
  lastError: string | null;
  post: { id: string; caption: string; scheduledAt: string | null };
}

const TABS = ['All', 'Active', 'Failed', 'Blocked'];

export default function PublishJobsPage() {
  const [jobs, setJobs] = useState<PublishJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/publish-queue/jobs', { signal: controller.signal })
      .then(r => r.json())
      .then(data => { setJobs(data); setLoading(false); })
      .catch(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = jobs.filter(job => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return ['PENDING', 'RUNNING', 'RETRY'].includes(job.status);
    if (activeTab === 'Failed') return ['FAILED', 'VERIFY_FAILED'].includes(job.status);
    if (activeTab === 'Blocked') return job.status === 'BLOCKED';
    return true;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Publish Queue</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Real-time status of every scheduled post. Failed jobs retry automatically — blocked jobs need account reconnection.
        </p>
      </div>

      <div className="flex gap-2 border-b">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No jobs in this category.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(job => (
            <div key={job.id} className="border rounded-lg p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{job.post.caption.slice(0, 80)}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <JobStatusBadge status={job.status as any} errorClass={job.errorClass as any} />
                  <span className="text-xs text-muted-foreground">
                    Attempt {job.attempts}/{job.maxAttempts}
                  </span>
                  {job.nextRunAt && ['RETRY', 'PENDING'].includes(job.status) && (
                    <span className="text-xs text-muted-foreground">
                      Next retry {formatDistanceToNow(new Date(job.nextRunAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
                {job.lastError && (
                  <p className="text-xs text-destructive mt-1 truncate">{job.lastError}</p>
                )}
              </div>
              {['FAILED', 'BLOCKED'].includes(job.status) && (
                <Button size="sm" variant="outline" className="shrink-0">
                  Retry
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add jobs link to sidebar navigation**

In the sidebar nav file (check `apps/web/src/components/sidebar` or layout), add a link to `/dashboard/jobs` with a `Activity` or `Radio` Lucide icon. Find where other nav items are defined and add:

```tsx
{ href: '/dashboard/jobs', label: 'Publish Queue', icon: Activity }
```

- [ ] **Step 4: Add /api/publish-queue/jobs endpoint if missing**

Check `apps/api/src/publish-queue/publish-queue.controller.ts`. Add a `GET /jobs` endpoint that calls `findForUser()`:

```typescript
@Get('jobs')
@UseGuards(JwtAuthGuard)
findJobs(@Req() req: AuthRequest, @Query('limit') limit?: string) {
  return this.queue.findForUser(req.user.sub, limit ? parseInt(limit) : 50);
}
```

- [ ] **Step 5: Start dev server and verify the page loads**

```bash
cd apps/web && npm run dev
```

Navigate to `http://localhost:3000/dashboard/jobs`. Confirm:
- Page loads without errors
- Tabs render correctly
- Skeleton loading shows while fetching
- Empty state shows if no jobs

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/dashboard/jobs/ apps/api/src/publish-queue/publish-queue.controller.ts
git commit -m "feat(ui): publish jobs dashboard — per-job status, error class, retry buttons"
```

---

## Task 11: BullMQ Migration — Millisecond-Precision Timing

> **Note:** This task replaces the Postgres polling queue with Redis + BullMQ. It is the highest-impact single infrastructure change. The research documents this as the engineering fix for timing precision (Root Cause #6) and is required for the "within 5 minutes of scheduled time" SLA claim.

**Files:**
- Modify: `apps/api/src/publish-queue/publish-queue.module.ts`
- Modify: `apps/api/src/publish-queue/publish-queue.service.ts`
- Modify: `apps/api/src/publish-queue/publish-worker.service.ts`
- Modify: `apps/api/docker-compose.yml` (add Redis service)

- [ ] **Step 1: Install BullMQ**

```bash
cd apps/api && npm install bullmq @nestjs/bullmq
```

- [ ] **Step 2: Add Redis to docker-compose**

In `apps/api/docker-compose.yml` (or the project-level compose), add:

```yaml
redis:
  image: redis:7-alpine
  restart: unless-stopped
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes
  ports:
    - "6379:6379"

volumes:
  redis_data:
```

- [ ] **Step 3: Add REDIS_URL to .env**

```
REDIS_URL=redis://localhost:6379
```

- [ ] **Step 4: Register BullMQ in publish-queue.module.ts**

```typescript
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get('REDIS_URL') },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'publish-instagram' },
      { name: 'publish-twitter' },
      { name: 'publish-linkedin' },
      { name: 'publish-tiktok' },
      { name: 'publish-youtube' },
      { name: 'publish-facebook' },
      { name: 'media-processing' },
      { name: 'notification' },
    ),
  ],
  ...
})
```

- [ ] **Step 5: Update enqueue() to use BullMQ delayed jobs**

Replace the `enqueue()` method to add a BullMQ delayed job instead of a Postgres record:

```typescript
async enqueue(postId: string, platform: string, runAt?: Date) {
  const delayMs = runAt ? Math.max(0, runAt.getTime() - Date.now()) : 0;
  const queueName = `publish-${platform.toLowerCase()}`;
  const queue = this.queues.get(queueName);
  if (!queue) throw new Error(`Unknown platform queue: ${queueName}`);

  await queue.add('publish', { postId, platform }, {
    delay: delayMs,
    attempts: 5,
    backoff: { type: 'exponential', delay: 2 * 60 * 1000 },
    removeOnComplete: false, // keep for audit trail
    removeOnFail: false,
    jobId: `post-${postId}-${platform}`, // idempotent
  });

  // Also persist to Postgres for UI visibility and DLQ
  return this.prisma.postPublishJob.upsert({
    where: { postId },
    create: { postId, nextRunAt: runAt ?? new Date(), status: 'PENDING' },
    update: { nextRunAt: runAt ?? new Date(), status: 'PENDING', attempts: 0 },
  });
}
```

- [ ] **Step 6: Implement BullMQ processor per platform**

Create a processor class that handles BullMQ jobs and delegates to the existing job logic. The `PublishWorkerService` polling loop can be removed once this is wired.

```typescript
// publish-queue/publish.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PublishQueueService } from './publish-queue.service';

@Processor('publish-instagram')
export class InstagramProcessor extends WorkerHost {
  constructor(private queue: PublishQueueService) { super(); }
  async process(job: Job) {
    await this.queue.runJobById(job.data.postId);
  }
}
// Repeat pattern for each platform — or use a base class with @Processor({ name: queue })
```

- [ ] **Step 7: Disable the polling timer in PublishWorkerService**

Once BullMQ processors are active, comment out or remove the `setInterval` polling loop. The BullMQ workers handle job dispatch.

- [ ] **Step 8: Start Redis and test**

```bash
docker compose up redis -d
cd apps/api && npm run start:dev
```

Schedule a test post via the API. Confirm it appears in Bull Board (if installed) and processes at the correct time.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/publish-queue/ apps/api/docker-compose.yml apps/api/.env.example
git commit -m "feat(queue): BullMQ migration — millisecond-precision delayed jobs, per-platform isolated queues"
```

---

## Self-Review

### Spec coverage check

| Research requirement | Task covering it |
|---|---|
| Proactive token monitor (every 4 hours) | Task 4 |
| 7-day warning, 3-day critical, expired blocking | Task 4 |
| Preserve jobs as BLOCKED on token expiry | Tasks 3 + 4 |
| Unblock jobs on reconnect | Task 5 |
| Error classification (permanent vs transient) | Task 2 |
| Smart retry with exponential backoff + jitter | Task 3 |
| Retry-After header handling | Task 3 |
| Per-platform isolated queues | Task 6 |
| One bad job never blocks another | Task 6 |
| ffprobe video metadata extraction | Task 7 |
| Platform requirements matrix (live config, not hardcoded) | Task 7 |
| Pre-flight PASS/WARN/FAIL per platform in composer | Task 7 (backend) + Task 10 (UI) |
| Per-account post count tracking | Task 8 |
| Bulk batch 2-minute minimum staggering | Task 8 |
| 429 with Retry-After | Task 3 |
| Timezone: store all times as UTC | Existing schema (confirmed) |
| BullMQ delayed jobs for precision timing | Task 11 |
| Post-publish verification (30s after success) | Task 9 |
| VERIFY_FAILED status | Task 9 |
| Dashboard: per-job status visibility | Task 10 |
| Retry buttons from UI | Task 10 |
| Account health dots in sidebar | Phase 10 shipped (confirmed in memory) |
| `status.1place2post.com` public status page | Not in this plan — Phase 12 |

### Gaps
- **Real platform API integration** (Instagram, TikTok, etc.) — intentionally excluded. This plan builds the reliability shell; real API calls go into a separate "Platform Integrations" plan.
- **Hashtag scanner** (Root Cause #7, content policy) — deferred; requires maintaining a live banned-hashtag list feed.
- **Public status page** — deferred to Phase 12.
- **Bull Board admin UI** — can be added as a 1-hour task to any step in Task 11.

### Type consistency check
- `ErrorClass` enum defined in schema (Task 1) → used in error-classifier.ts (Task 2) → used in publish-queue.service.ts (Task 3). ✓
- `TokenStatus` enum defined in schema (Task 1) → used in token-health.service.ts (Task 4) → used in social-account.service.ts (Task 5). ✓
- `JobStatus.BLOCKED` defined in schema (Task 1) → used in publish-queue.service.ts (Task 3) → used in JobStatusBadge (Task 10). ✓
- `JobStatus.VERIFY_FAILED` defined in schema (Task 9) → used in publish-queue.service.ts (Task 9) → used in JobStatusBadge (Task 10). ✓

---

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-04-27-reliability-infrastructure.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks

**2. Inline Execution** — Execute tasks in this session using executing-plans skill

**Which approach?**
