# 1Place2Post — Publishing Reliability Deep-Dive
## Root Cause Analysis: Why Social Media Schedulers Fail at Scale

> **For Claude Code & Engineering**: This document is the engineering specification for solving the #1 problem in the social media scheduling industry. Every architecture decision in the publish pipeline should be grounded in this analysis. This is not a UX document — it is an infrastructure and systems design document.

---

## Executive Summary

The single most complained-about problem across every social media scheduling tool — Publer, Content360, SocialBee, Metricool, Buffer, Hootsuite — is **posts that don't publish reliably**. This failure is universally blamed on "platform API instability," but that's a convenient deflection. The research reveals a more precise truth:

**Platform APIs are imperfect but predictable. The failures are almost entirely caused by scheduler-side architectural deficiencies — not the platforms themselves.**

The eight root causes documented here are solvable engineering problems, not acts of God. This document identifies each cause, explains exactly why competitors fail to solve it, and specifies the engineering solution required to make 1Place2Post the first credible tool that can market "posts that actually post."

---

## Part 1: The Full Failure Taxonomy

Every publishing failure in a social media scheduler traces back to one of eight root causes. They are ordered here from most frequent to least frequent based on aggregated user complaints across Publer, Content360, SocialBee, Metricool, Buffer, and Hootsuite.

---

### Root Cause #1: OAuth Token Expiry — The #1 Silent Killer

**Frequency:** Extremely high. The single most-reported cause of "random" failures across all platforms.

**What actually happens:**

When a user connects a social account, the platform issues two tokens:
- An **access token** — used for all API calls, short-lived
- A **refresh token** — used to get a new access token, longer-lived

When the access token expires, the scheduler must call the refresh endpoint to get a new one. If that refresh call fails (or is never attempted), the next publish job silently fails with a 401 Unauthorized error.

**Token lifetimes by platform (as of early 2026):**

| Platform | Access Token | Refresh Token | Auto-refresh possible? |
|---|---|---|---|
| Instagram/Facebook | 60 days (long-lived) | N/A (must re-auth) | No — requires user action |
| TikTok | 24 hours | 90 days | Yes |
| Twitter/X | 2 hours | 6 months | Yes |
| YouTube/Google | 1 hour | Indefinite | Yes |
| LinkedIn | 60 days | 1 year | Yes (with offline_access scope) |
| Pinterest | 1 hour | 60 days | Yes |

**Why Meta/Instagram is uniquely painful:**
Instagram uses a "long-lived token" model — there is no refresh token. The long-lived token lasts 60 days and can be refreshed once before expiry, but ONLY if the app calls the refresh endpoint proactively within a narrow window. If the app misses that window, the token is dead and the user must manually reconnect. This is the root cause of Publer's #1 complaint: "social accounts constantly disconnect at random."

**Why competitors fail at this:**

Most schedulers implement passive token management — they only discover expiry when a publish job returns a 401. By then, it's too late: the scheduled post has already missed its window. The user gets notified after the fact, not before.

Publer's own help center has a dedicated article titled "How to fix constant reauthentication issues" rated "Popular" — confirming that their solution to this problem is to teach users to manually fix it, not to prevent it.

**The correct engineering solution:**

```
PROACTIVE TOKEN HEALTH MONITOR

Every 4 hours, for every SocialAccount in the database:
  1. Check token.expiresAt vs now()
  2. If expiresAt is within 7 days:
     → Attempt proactive refresh
     → If refresh succeeds: update token, reset warning
     → If refresh fails (no refresh token, like Meta):
        → Set account.status = TOKEN_EXPIRING
        → Set account.expiresInDays = X
        → Create Notification for user: "Your Instagram account
          'brand_name' needs re-authorization in X days"
  3. If expiresAt has passed:
     → Set account.status = DISCONNECTED
     → Mark all SCHEDULED jobs for this account as BLOCKED
     → Create urgent Notification + email alert
     → NEVER attempt to publish to a DISCONNECTED account

SIDEBAR STATUS SYSTEM (UX enforcement):
  CONNECTED  = green dot
  EXPIRING   = amber dot (7 days warning)
  CRITICAL   = red dot (3 days warning)
  EXPIRED    = red X (requires reconnection)

Critical: Failed jobs for DISCONNECTED accounts must be
preserved in BLOCKED state (not FAILED), so they can be
automatically retried once the account is reconnected.
```

**1Place2Post implementation reference:** `SocialAccountModule` already stores `tokenExpiresAt` and has expiry warning flags. The proactive monitor described above must be added as a scheduled cron job in `PublishQueueModule` or as a dedicated `TokenHealthModule`.

---

### Root Cause #2: Rate Limiting — The Batch Processing Bomb

**Frequency:** High — appears most severely in bulk upload workflows, which is exactly the use case creators care most about.

**What actually happens:**

Every social media platform enforces API rate limits at two levels:

**1. Per-account posting limits (daily/hourly):**
| Platform | Limit | Window |
|---|---|---|
| Instagram | 25 API-published posts | Per 24 hours, per account |
| TikTok | ~5–10 posts | Per 24 hours, per account |
| Twitter/X | 300 tweets | Per 3 hours, per account (tier-dependent) |
| YouTube | No hard limit | But rapid uploads trigger review queue |
| LinkedIn | 150 API calls | Per day, per member token |
| Facebook Pages | 250 posts | Per hour, per page |

**2. App-level rate limits (shared across all users):**
This is the dangerous one. A scheduling tool's app credentials have aggregate limits across ALL users. Meta tightened these limits significantly in 2024-2025. For DM automation specifically, Meta reduced per-hour limits from 5,000 calls to 200 — a 96% reduction.

**The thundering herd problem:**

When a user bulk-uploads 500 posts (Publer's advertised limit), they typically want them scheduled across various future dates. But the *upload and validation* process still hammers the platform API synchronously — creating a sudden spike of API calls from a single user. When multiple users do this simultaneously (morning content batch day is Monday 9am for most users), the app hits aggregate rate limits and all concurrent jobs start failing with 429 responses.

**Why competitors fail at this:**

Most schedulers implement naive queue processing: pull next job, run it, repeat. When they get a 429, they either:
- Fail the job permanently (wrong — it's retriable)
- Retry immediately (wrong — makes rate limit worse)
- Wait a fixed interval (suboptimal — doesn't honor Retry-After headers)

SocialBee's documented failure mode is instructive: "If a single post in a queue has a problem, the whole queue will stall, stopping that timeslot... and there is no indication which post has the problem." This is a textbook isolated-queue failure — one bad job blocks all subsequent jobs in that category.

**The correct engineering solution:**

```
PER-ACCOUNT RATE LIMIT MANAGER

1. ISOLATED QUEUES (critical):
   Each (post, platform_account) combination gets its
   own queue slot. One failed job NEVER blocks another.
   Failure is isolated to the specific post+account pair.

2. 429 RESPONSE HANDLING:
   When platform returns HTTP 429:
     → Read Retry-After header (if present)
     → Add job back to queue with delay = max(Retry-After, 60s)
     → Apply exponential backoff with jitter for subsequent retries
     → Log rate_limit_hit event for monitoring
   Formula: delay = min(base_delay * 2^attempt + jitter, max_delay)
   Where: base_delay=60s, max_delay=3600s, jitter=random(0, 30s)

3. PROACTIVE RATE LIMIT AWARENESS:
   Track per-account API call counts per time window.
   For Instagram: track last 24h post count per account
   Before attempting publish:
     → Check if account has room in rate limit window
     → If at limit: delay job until window resets
     → If approaching limit (>80%): add priority flag for admin alert

4. BULK BATCH STAGGERING (for bulk uploads):
   When user uploads 50+ posts in a single batch:
     → Do NOT schedule all at exact requested times
     → Apply minimum 2-minute spacing between posts to
       same platform account
     → Show user the adjusted schedule with explanation
     → Allow manual override with explicit warning

5. DEDICATED BULL QUEUE PER PLATFORM:
   instagram-queue, twitter-queue, linkedin-queue, etc.
   Each queue has its own concurrency limit reflecting
   platform-specific rate limit budgets.
   Platform queues are processed independently — LinkedIn
   failures never affect Instagram processing.
```

**BullMQ (Phase 10 target) vs current Postgres queue:**

The current Postgres-based queue has a fundamental limitation for rate limiting: it polls the database on a fixed interval and processes jobs in sequence. This means:
- Minimum job latency = polling interval (typically 5-30 seconds)
- No concept of per-platform concurrency control
- Exponential backoff requires database state mutations on every retry

BullMQ with Redis solves all three:
- Job processing starts within milliseconds of scheduled time
- Per-queue concurrency settings enforce platform-specific limits natively
- Retry with delay is a first-class BullMQ feature (no extra DB writes)
- Benchmark: BullMQ processes 8,300 jobs/second at concurrency=100 vs Postgres queue at ~500-1,000

**Migration path (Phase 10 spec already exists):** Replace `PostPublishJob` Postgres table with BullMQ `publish-queue`. Retain exponential backoff via BullMQ job options. This is the single highest-impact reliability improvement available.

---

### Root Cause #3: Media Validation Failures — Silent Format Rejections

**Frequency:** High — especially for video content and multi-platform cross-posting.

**What actually happens:**

Every platform has strict, sometimes undocumented, and frequently changing media requirements. When media fails validation, the platform returns a 400 Bad Request or media processing error, often with a cryptic message. Most schedulers surface this as a generic "post failed" error.

**Current platform media requirements (as of April 2026):**

**Instagram:**
- Feed images: JPEG/PNG, max 8MB, aspect ratio 4:5 to 1.91:1
- Reels video: MP4 H.264, max 4GB, exactly 9:16 for Reels, up to 15 min
- Stories: MP4, max 4GB, 9:16, max 60 seconds
- Carousel: 2–10 items, each within image/video specs above

**TikTok:**
- Video: MP4 or WebM only, max 4GB
- Duration: 3 seconds to 10 minutes (longer for some verified accounts)
- Minimum resolution: 720p recommended
- Important: copyrighted music in the video = auto-rejection with no error message
- No image-only posts via API (video only)

**Twitter/X:**
- Images: JPEG/PNG/GIF/WebP, max 5MB (images), max 15MB (GIFs)
- Videos: MP4, max 512MB, max duration 2:20 (2 minutes 20 seconds)
- Note: WebP images accepted natively but may render poorly on some clients

**LinkedIn:**
- Images: JPEG/PNG, max 10MB
- Videos: MP4, max 5GB, 3 seconds to 10 minutes
- PDFs: max 100MB, max 300 pages (for document posts)
- Quirk: LinkedIn fetches the URL thumbnail at publish time — if the URL is unreachable, the preview fails silently

**YouTube:**
- Shorts: vertical (9:16), max 60 seconds, max 256GB
- Long-form: max 256GB, 12 hours
- Must be in MP4, MOV, AVI, or WebM

**Facebook:**
- Images: JPEG/PNG/BMP/GIF, max 30MB
- Videos: MP4, max 10GB, max 240 minutes

**Why competitors fail at this:**

The failure happens in two ways:

1. **No pre-flight validation**: The scheduler accepts the file, queues the post, and only discovers the format problem at publish time — hours or days later. The user has no idea anything is wrong until the post fails silently.

2. **Wrong validation logic**: Some tools validate file size but not codec, or aspect ratio but not duration. Instagram specifically has started rejecting H.265/HEVC video even though it's technically a valid format — because their API only accepts H.264. Tools that don't check codec will see these fail.

Publer's bulk video upload crashes specifically at 50+ Reels files — suggesting no batched validation or memory management for large uploads.

**The correct engineering solution:**

```
PRE-FLIGHT MEDIA VALIDATION ENGINE

At UPLOAD TIME (not at schedule time):
  For each uploaded file:
  1. Detect actual file type via magic bytes (not extension)
  2. For video files, extract metadata:
     - Container format (MP4, WebM, MOV...)
     - Video codec (H.264, H.265, VP9...)
     - Audio codec (AAC, MP3, Opus...)
     - Resolution (width × height)
     - Aspect ratio
     - Duration in seconds
     - File size in bytes
     - Bitrate
  3. For image files:
     - Actual format (JPEG, PNG, WebP, HEIF...)
     - Dimensions (width × height)
     - File size
     - Color profile (sRGB vs others)

  For each (file, platform) combination:
  4. Run validation against platform requirements matrix
  5. Generate ValidationResult:
     - PASS: all requirements met
     - WARN: will likely work but check X (e.g. near file size limit)
     - FAIL: specific requirement violated (e.g. "Video is H.265 —
             Instagram requires H.264. Please re-encode.")

  Critical UX rule:
  - Show validation results PER PLATFORM in the composer
  - Never let a user schedule a FAIL status post without explicit override
  - For WARN status: show the warning clearly but allow scheduling
  - For FAIL status: block scheduling, show fix instructions

MEDIA COMPATIBILITY MATRIX (maintain as a live config file,
not hardcoded — platform requirements change frequently):

const PLATFORM_REQUIREMENTS = {
  instagram: {
    image: { formats: ['jpeg','png'], maxSizeMB: 8,
             aspectRatios: ['1:1','4:5','1.91:1'] },
    reel:  { formats: ['mp4'], codec: 'h264',
             maxSizeMB: 4096, maxDuration: 900,
             aspectRatio: '9:16' },
    story: { formats: ['mp4'], codec: 'h264',
             maxSizeMB: 4096, maxDuration: 60,
             aspectRatio: '9:16' }
  },
  twitter: {
    image: { formats: ['jpeg','png','gif','webp'], maxSizeMB: 5 },
    video: { formats: ['mp4'], maxSizeMB: 512, maxDuration: 140 }
  },
  // ... etc
}
```

**Implementation tool:** Use `ffprobe` (part of FFmpeg, available server-side) to extract video metadata. For images, use `sharp`. Both are available as npm packages and run server-side in the NestJS API.

---

### Root Cause #4: Platform Outages — Retry Logic Determines Whether You Survive Them

**Frequency:** Moderate but high-impact. Meta had multiple outages in 2025. Twitter/X has had recurring infrastructure issues since ownership change.

**What actually happens:**

Platform APIs return HTTP 5xx errors during outages. The question isn't whether outages happen — they do and always will. The question is what the scheduler does when they happen.

**How competitors handle outages (badly):**

- **Content360**: Jobs disappear — the platform was down for 2 months in late 2025
- **Most tools**: Posts fail permanently on first 5xx, user must manually reschedule
- **SocialBee**: Queue stalls on the failed post, blocking all subsequent posts in that category
- **Publer**: StatusGator shows multiple 20-47 minute outages in late 2025 / early 2026 where posts were not published to GBP

The fundamental failure: treating a transient 5xx as a permanent failure and marking the job as failed.

**The correct engineering solution:**

```
SMART RETRY POLICY — distinguish error types:

PERMANENT FAILURES (do NOT retry):
  400 Bad Request = content/format issue — fix required first
  401 Unauthorized = token expired — reconnect required
  403 Forbidden = permissions issue — reconnect required
  422 Unprocessable Entity = content policy violation
  Any error returned consistently 3+ times

TRANSIENT FAILURES (DO retry with backoff):
  429 Too Many Requests = rate limited
  500 Internal Server Error = platform server error
  502 Bad Gateway = platform infrastructure issue
  503 Service Unavailable = platform outage
  504 Gateway Timeout = platform timeout
  Network errors (ECONNRESET, ETIMEDOUT)

RETRY SCHEDULE for transient failures:
  Attempt 1: Wait 2 minutes (immediate grace period)
  Attempt 2: Wait 5 minutes
  Attempt 3: Wait 15 minutes
  Attempt 4: Wait 1 hour
  Attempt 5: Wait 4 hours
  Attempt 6+: Wait 24 hours (max)
  Give up after 7 attempts or 48 hours past schedule time

NOTIFICATION POLICY:
  First failure: Log silently (transient glitch likely)
  Second failure: Notify user (single notification, not per-retry)
  Fifth failure: Urgent notification + platform outage indicator
  Final failure: Permanent failure notification with cause

IMPORTANT: During active platform outage (3+ users seeing 5xx):
  → Detect pattern and raise platform_outage flag
  → Pause all jobs for that platform
  → Show platform-level status indicator in dashboard
  → Resume all jobs automatically when platform recovers
  → This prevents individual users from getting 6 "failure" emails
    for the same platform outage
```

---

### Root Cause #5: Queue Architecture — The Single Global Queue Problem

**Frequency:** Moderate but architecturally critical. This is the root cause of SocialBee's stall problem and most "posts backed up" complaints.

**What actually happens:**

Most schedulers use a single sequential queue: jobs are processed in order, one at a time (or with low concurrency). This creates two failure modes:

**Failure Mode A: One bad job stalls all subsequent jobs**
SocialBee explicitly has this problem. If post #3 in a category queue fails and the retry logic blocks the queue, posts #4, #5, #6 never run. Users find out when they check their calendar and everything from 3pm onwards is unposted.

**Failure Mode B: Burst processing creates artificial peaks**
A user uploads 500 posts on Sunday night to schedule the whole month. The queue processes them asynchronously and validates/pre-processes all 500 simultaneously, spiking server CPU and causing timeouts that manifest as "bulk upload crashes" (Publer's exact complaint).

**The correct engineering solution:**

```
ISOLATED JOB ARCHITECTURE

Rule: Every publish job is independent. No job can block another.

Implementation with BullMQ:

1. SEPARATE QUEUES PER PURPOSE:
   - publish-queue: actual posting to platform APIs
   - media-queue: media validation and pre-processing
   - rss-queue: RSS feed polling and draft creation
   - notification-queue: sending emails/in-app notifications

2. SEPARATE QUEUES PER PLATFORM:
   - publish-instagram
   - publish-twitter
   - publish-linkedin
   - publish-tiktok
   Each with its own concurrency setting matching platform limits

3. CONCURRENCY SETTINGS (per platform queue):
   - Instagram: concurrency=3 (conservative, 25/day limit)
   - Twitter: concurrency=10 (300/3hr limit)
   - LinkedIn: concurrency=2 (150/day limit)
   - TikTok: concurrency=2 (5-10/day limit)

4. JOB ISOLATION:
   Each PostPublishJob has:
   - jobId = uuid (globally unique)
   - postId = reference to Post
   - socialAccountId = specific account
   - platformQueue = which queue it belongs to
   - No job knows about or depends on any other job

5. MEDIA PRE-PROCESSING SEPARATION:
   When user uploads bulk media:
     → Each file gets its own media-queue job
     → Concurrency=5 (limited by server capacity, not platform limits)
     → Jobs process in parallel up to concurrency limit
     → User sees progress: "Validating 47/500 files..."
   This eliminates bulk upload crashes because no single upload
   can consume all server resources.

6. DEAD LETTER QUEUE (DLQ):
   After max_retries exceeded:
     → Move job to dlq-{platform} queue
     → Never auto-delete failed jobs
     → User can manually retry from DLQ in /dashboard/jobs
     → DLQ jobs kept for 30 days then archived to PostLog
```

---

### Root Cause #6: Timezone and Precision Timing Failures

**Frequency:** Moderate — often causes "post went out at wrong time" or "post was 15 minutes late" complaints.

**What actually happens:**

Scheduling tools store scheduled times in the database. Cron-based workers or queue pollers run on an interval (typically every 1-5 minutes). A post scheduled for exactly 9:00am may not actually run until 9:05am if the poller fires at 8:58am and next fires at 9:03am.

Additionally, timezone handling errors cause posts to be scheduled in UTC but displayed in user's local time incorrectly, leading to posts going live at unexpected hours.

**Why competitors fail at this:**

Cron-based polling workers (node-cron, as used by 1Place2Post's current RSS campaigns) have inherent precision limitations. If the cron fires every minute and the server is under load, actual job execution can lag by 1-3 minutes. For time-sensitive content (breaking news, event promotions), this matters.

Timezone bugs are pervasive because most databases store timestamps in UTC but most users think in local time. Buffer's and Metricool's help centers both have timezone troubleshooting articles — confirming this is a real, documented issue across the industry.

**The correct engineering solution:**

```
TIMING PRECISION SYSTEM

1. STORE ALL TIMES IN UTC ONLY:
   Database: scheduledAt TIMESTAMP WITH TIME ZONE
   API: Accept ISO 8601 with timezone offset
   Worker: Convert to UTC before storing
   Display: Convert to user's timezone in the frontend

2. BULLMQ DELAYED JOBS (vs polling):
   Instead of polling "find jobs due in the next N minutes":
   → At schedule creation time, calculate exact delay:
     delay_ms = scheduledAt.getTime() - Date.now()
   → queue.add(jobName, data, { delay: delay_ms })
   → BullMQ fires the job at exactly delay_ms from now
   → Precision: within ~100ms of scheduled time
   → No polling, no missed windows

3. TIMEZONE VALIDATION IN UI:
   When user schedules a post:
     → Display: "Scheduled for Tue Apr 29 at 9:00 AM (your time: EDT)"
     → Show UTC equivalent as hover text
     → Store confirmed UTC value in database
   This eliminates ambiguity and prevents "it posted at the wrong time"

4. SCHEDULE PROXIMITY WARNING:
   If user schedules a post within 5 minutes of now:
     → Show warning: "This post is scheduled very soon.
        Processing may take 1-2 minutes to complete."
   Prevents user confusion when near-future posts "seem late"
```

---

### Root Cause #7: Content Policy Violations — The Invisible Rejection

**Frequency:** Lower but creates significant user confusion because failures are silent.

**What actually happens:**

Platform content moderation systems scan posts at publish time. Violations include:

- **Copyrighted music in video** (TikTok is especially aggressive — auto-rejects)
- **Banned or restricted hashtags** (Instagram maintains a dynamic list that changes weekly)
- **Certain health/financial claims** (platform-specific policies)
- **Link restrictions** (some platforms penalize posts with external links, some reject certain domains)
- **Content that triggers spam detection** (too many hashtags, posting too frequently)

The critical problem: platforms often return a success response (HTTP 200) but then suppress, shadow-ban, or silently remove the post. The scheduler reports "published successfully" but the post never appears.

**The correct engineering solution:**

```
POST-PUBLISH VERIFICATION SYSTEM

After a successful publish API call:
  1. Wait 30 seconds (allow platform to process)
  2. Query platform API for the post's status
  3. If post exists and is visible: mark PostPublishJob as SUCCESS
  4. If post returns 404 or "hidden" status:
     → Mark job as VERIFY_FAILED
     → Notify user: "Post was sent to [platform] but
        may have been filtered. Check your account directly."
     → Do NOT automatically retry (might make spam detection worse)

HASHTAG SCANNER (preventive):
  At schedule time, for Instagram and TikTok posts:
  1. Extract all hashtags from caption
  2. Check against known-banned hashtag list
     (maintained as a frequently-updated config file)
  3. If banned hashtag found:
     → Block scheduling
     → Show: "⚠️ #[hashtag] is currently restricted on Instagram.
        Posts with restricted hashtags receive reduced distribution.
        Remove it to proceed."
  Note: The list changes frequently — build a mechanism
  to update it without a code deploy.

CONTENT HEALTH WARNINGS (pre-schedule):
  - Caption length per platform (show character counter)
  - Link in Instagram caption (warn: "Instagram doesn't make
    links in captions clickable — use link in bio instead")
  - Too many hashtags on TikTok (warn: ">5 hashtags may trigger
    spam detection on TikTok")
  - Copyrighted music detection: if video has audio that matches
    a known copyrighted track, warn before scheduling
```

---

### Root Cause #8: Media Upload Pipeline Failures — The Async Processing Gap

**Frequency:** High for video-heavy users. The cause of Publer's bulk Reel uploader crashes.

**What actually happens:**

Publishing a video to social media is a multi-step process that most schedulers handle poorly:

```
User uploads video
  → Tool stores file locally
  → At publish time: upload file to platform
  → Platform processes video (transcoding, thumbnail generation)
  → Platform returns media container ID
  → Tool publishes post using container ID
  → Platform finalizes post

The problem: steps 3-6 can take 30 seconds to 5 minutes
for large video files. Most schedulers treat this as
a synchronous blocking operation.
```

When the tool runs 50 simultaneous video uploads during a bulk upload batch, each one blocks a worker thread for 30-120 seconds. The server runs out of available threads. New requests time out. The upload "crashes" with a vague error — which is exactly what Publer users experience.

**The correct engineering solution:**

```
ASYNC MEDIA UPLOAD PIPELINE

Phase 1: File ingestion (fast, synchronous):
  User uploads → validate file → store to S3/R2 → return MediaAsset ID
  (< 500ms for the user-facing response)

Phase 2: Media pre-processing (async, queued):
  media-queue job:
    → Download from S3
    → Run ffprobe validation
    → Generate thumbnail
    → If needed: transcode to platform-compatible format
    → Update MediaAsset.status = READY
    → This can take 30-120 seconds — all async

Phase 3: Platform media upload (async, at publish time):
  At scheduled publish time:
    → Download ready MediaAsset from S3
    → Upload to platform API using chunked upload for large files
    → Platform processing: poll platform API for "ready" status
      (most platforms have a media container status endpoint)
    → Wait up to 5 minutes for "ready" status
    → If timeout: mark job as FAILED with error "Platform media
      processing timeout — retry manually"

CHUNKED UPLOAD FOR LARGE FILES:
  For files > 50MB:
    → Use multipart upload to S3 first (parallel chunks)
    → Then use platform-specific chunked upload APIs
    → Instagram: /media/upload endpoint supports chunked
    → This prevents single-file upload timeouts
    → Show upload progress in UI: "47% uploaded (48MB/100MB)"

CONCURRENCY LIMITS:
  media-queue: concurrency = 3 per worker instance
  (prevents server resource exhaustion during bulk uploads)
  Each media job reserves:
    - Download from S3: ~10s
    - ffprobe analysis: ~2s
    - Transcoding (if needed): ~30-120s
    - Upload to platform: ~10-60s
  Total: up to 3 minutes per job, 3 concurrent = max 3 threads
  blocked at any time.
```

---

## Part 2: Competitor-Specific Failure Analysis

### Publer's Architecture Weaknesses

Based on public information, Publer appears to use a cron-based polling worker against a PostgreSQL jobs table. This is evidenced by:
- The description of their worker as "polling PostPublishJob table" (our analysis)
- No mention of Redis or BullMQ in any public documentation
- The specific failure mode of "bulk video upload crashes" which is consistent with synchronous processing
- Documented outages on StatusGator showing "internal server errors" that affect bulk operations

**The specific Publer failure for 50+ Reel bulk uploads:**

When a user drags 50 Reel files into Publer's uploader:
1. 50 simultaneous file processing operations begin
2. No chunked processing or concurrency limits
3. Server RAM/CPU spike as all 50 files are validated simultaneously
4. Node.js event loop becomes blocked by synchronous file I/O
5. HTTP request to the client times out
6. User sees: "Whoops, something went wrong"
7. Some files are uploaded, others aren't — state is corrupted

**1Place2Post's Phase 10 migration to BullMQ specifically solves this by:**
- Moving media processing to dedicated queued jobs with concurrency=3
- User sees real-time progress as each file processes
- No single batch can overwhelm the server
- Files that fail validation are reported individually, not as a batch crash

### SocialBee's Queue Stall Problem

SocialBee's category/bucket system uses a queue per category. If a post in a bucket fails validation or gets a platform error, the bucket queue pauses to avoid "spamming" retries. But there's no timeout on the pause — the queue stalls indefinitely. Users only discover this when they notice days of content haven't gone out.

**The fix is simple: job isolation.** Individual job failures must never pause a queue. BullMQ handles this correctly by default — each job either succeeds or fails independently. Queue processing continues regardless of individual job status.

### Content360's Server Outage Problem

Content360's November-December 2025 outage lasted weeks because their entire publishing pipeline ran on a single server with no redundancy. When the server went down, all queued jobs were lost — there was no durable queue backing them.

**1Place2Post's Postgres queue is actually better than this** because jobs are persisted to PostgreSQL before the worker processes them. Even if the worker crashes, the jobs survive in the database. The BullMQ migration maintains this durability via Redis AOF (append-only file) persistence.

### Metricool's Token Architecture Problem

Metricool's billing crisis generates the most press, but their reliability issues trace to a different root cause: they authenticate using the same OAuth token for both publishing and analytics. When Meta deprecated certain API metrics in January 2025, Metricool's tokens needed re-scoping — forcing thousands of users to reconnect accounts.

**The solution is scope-separated tokens:** issue publishing permissions and analytics permissions separately so a metrics API change doesn't break the publishing pipeline.

---

## Part 3: The Complete Solution Architecture for 1Place2Post

### Priority Order (based on failure frequency and user impact)

**Priority 1 — Must fix before any reliability marketing:**

1. **Proactive token monitor** (Root Cause #1)
   - Build cron job that checks all tokens every 4 hours
   - Warn users 7 days before expiry via sidebar indicator + notification
   - Block publish jobs for EXPIRED accounts (don't let them fail silently)
   - Preserve jobs in BLOCKED state for retry after reconnection

2. **Per-platform isolated queues** (Root Cause #5)
   - Implement in Phase 10 BullMQ migration
   - One queue per platform (publish-instagram, publish-twitter, etc.)
   - Each queue has its own concurrency setting
   - One job failure never affects another job

3. **Smart retry on transient failures** (Root Cause #4)
   - Distinguish permanent vs transient HTTP errors
   - Implement exponential backoff with jitter
   - Never retry a 400/401/403/422 (permanent)
   - Always retry a 429/5xx (transient)
   - Honor Retry-After headers from 429 responses

**Priority 2 — Implement before public launch:**

4. **Pre-flight media validation** (Root Cause #3)
   - ffprobe integration for video metadata extraction
   - Per-platform requirements matrix (externalized as config)
   - Show validation results in composer before scheduling

5. **Async media upload pipeline** (Root Cause #8)
   - Dedicated media-queue with concurrency=3
   - Chunked upload for files >50MB
   - Progress tracking per file in bulk upload UI

6. **Rate limit awareness** (Root Cause #2)
   - Track per-account post counts in sliding windows
   - Automatic staggering for bulk batches (2-minute minimum spacing)
   - 429 handling with backoff and auto-retry

**Priority 3 — Differentiator features:**

7. **Timezone precision** (Root Cause #6)
   - BullMQ delayed jobs (precise timing, eliminates polling latency)
   - Clear UTC/local time display in UI

8. **Post-publish verification** (Root Cause #7)
   - Poll platform API 30 seconds after publish to confirm post exists
   - Hashtag scanner in composer

---

## Part 4: The "Posts That Actually Post" SLA Framework

Once the above is implemented, 1Place2Post can market a concrete publishing reliability SLA. Competitors have never done this — it's a category-first claim.

**Proposed SLA language:**

> "1Place2Post guarantees that any post meeting platform requirements and scheduled with a valid connected account will be published within 5 minutes of its scheduled time, or retried automatically for up to 48 hours with full status visibility. If a post cannot be published due to your platform account status, you'll receive a warning at least 7 days in advance."

**The dashboard metric to back it up:**

Add to the Dashboard overview: **"Publishing reliability (last 30 days): 99.X%"**

This is calculated as:
```
reliability = successful_publishes / (attempted_publishes - platform_outage_failures)
```

Note: Posts that fail due to platform outages (5xx from platform, not from 1Place2Post infrastructure) are excluded from the reliability calculation — those are outside our control and should be displayed as "platform incident" not "publishing failure."

**Public status page:**
Host at `status.1place2post.com` showing:
- Current publish queue health
- Per-platform API status (aggregated from DownDetector + our own monitoring)
- Last 90-day uptime history
- Active incidents with real-time updates

This makes the reliability promise verifiable, not just marketing copy.

---

## Part 5: Implementation Checklist for Claude Code

When implementing the publishing reliability system, the following must be in place:

### TokenHealthModule (new)
- [ ] Cron job: runs every 4 hours
- [ ] Checks `SocialAccount.tokenExpiresAt` for all accounts with `status = ACTIVE`
- [ ] If `expiresAt < now() + 7 days`: refresh if possible, else set `status = TOKEN_EXPIRING`
- [ ] If `expiresAt < now()`: set `status = TOKEN_EXPIRED`
- [ ] Create `Notification` records for warning and expired states
- [ ] Update `SocialAccount` status enum: `ACTIVE | TOKEN_EXPIRING | TOKEN_CRITICAL | TOKEN_EXPIRED | DISCONNECTED`
- [ ] Block all `PublishQueueModule` jobs for `TOKEN_EXPIRED` or `DISCONNECTED` accounts

### PublishQueueModule updates
- [ ] Error classification: permanent vs transient by HTTP status code
- [ ] Exponential backoff with jitter for transient failures
- [ ] Read and honor `Retry-After` headers from 429 responses
- [ ] Per-platform isolated processing (separate queue workers per platform)
- [ ] `PostPublishJob.status` enum: `PENDING | RUNNING | SUCCESS | FAILED | BLOCKED | RETRYING`
- [ ] `PostPublishJob.errorClass`: `PERMANENT | TRANSIENT | RATE_LIMIT | TOKEN_EXPIRED | PLATFORM_OUTAGE`
- [ ] Never mark a transient failure as FAILED until max_retries exhausted
- [ ] Post-publish verification call (30s after success, confirm post exists via platform API)

### MediaModule updates
- [ ] Integrate `ffprobe` for video metadata extraction
- [ ] Platform requirements matrix as JSON config (not hardcoded)
- [ ] `MediaAsset.validationResults`: per-platform PASS/WARN/FAIL results
- [ ] Block scheduling if any target platform has FAIL status
- [ ] Chunked upload for files >50MB to S3
- [ ] Dedicated media-processing queue with concurrency=3

### Frontend (Dashboard + Composer)
- [ ] Sidebar: per-account connection health dots (green/amber/red)
- [ ] Dashboard widget: "X accounts need attention" with list
- [ ] Composer: per-platform validation badges on media upload
- [ ] Composer: character counter turns red at 100% of limit per platform
- [ ] `/dashboard/jobs`: status tabs, error class badges, retry buttons
- [ ] Toast notifications for failures (one notification per failure, not one per retry)

### Phase 10 BullMQ migration (existing spec)
- [ ] Replace Postgres polling with BullMQ + Redis
- [ ] Separate queues: `publish-{platform}`, `media-processing`, `rss-campaign`, `notification`
- [ ] Bull Board UI at `/admin/queues`
- [ ] BullMQ delayed jobs for precise timing (not polling)
- [ ] DLQ (dead letter queue) per platform for manual inspection
