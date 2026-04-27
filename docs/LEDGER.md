# 1Place2Post Architecture Ledger

This document maintains a chronological record of major architectural decisions, schema changes, and feature integrations made throughout the lifespan of the 1Place2Post project.

---

### Phase 0: Monorepo Foundation (2026-02-23)
- **Monorepo Setup**: Configured a single repository containing a NestJS backend (`apps/api`) and a Next.js frontend (`apps/web`) using npm workspaces.
- **Dockerization**: Built distinct Dockerfiles for both services and orchestrated them via `docker-compose.staging.yml`. Set up a persistent volume for the Postgres database.
- **Database Schema**: Initialized the Prisma schema with the base `User`, `SocialAccount`, `Post`, `SocialPlatform`, `PostStatus`, and `Role` definitions.

### Phase 1: Authentication & Core Publishing (2026-02-23)
- **JWT Authentication**: Implemented standard `bcrypt` hashing and JWT tokens within the `AuthModule`.
- **RBAC Foundation**: Defined `ADMIN` and `USER` roles in Prisma. Built global guards in NestJS to read token payload and block unauthenticated actions.
- **Core CRUD**: Built the `PostModule` granting standard Create, Read, Update, Delete access. Added logical safety checks preventing cross-tenant data access.

### Phase 2: Link Pages & Bot Engines (2026-02-24)
- **Link-in-Bio System**: Built dynamic routing (`/l/:slug`) on the NextJS side to render personalized link pages. Added the `LinkClick` tracking table.
- **Bot Engine rules**: Created the initial `BotRule` schema to permit users to define auto-replies or webhook pings based on strict string matching (`CONTAINS`, `REGEX`, `ANY`).

### Phase 3: Media Uploads & Teams Workspaces (2026-02-24)
- **Local Storage**: Configured Multer in NestJS to save physical files on the disk (`/uploads/*`) and served them statically.
- **Team Workspaces**: Shifted the app architecture towards a B2B model by introducing `Team` and `TeamMember` tables. Users can now share resources (Templates, Posts, Analytics).
- **Global Analytics**: Set up a massive `EngagementEvent` table capable of logging raw clicks from any link page, attributing them to a device/IP, for time-series aggregation.

### Phase 4: Approvals & Outgoing Webhooks (2026-02-24)
- **Workflows**: Added `PostApproval` tables to handle the review process. Hooked up notifications when an item is tagged as "Requested" versus "Rejected".
- **RSS ingestion**: Set up node cron jobs to read external `.xml` feeds and automatically translate them into Draft posts inside the `RssCampaign` engine.
- **Event Forwarding**: Allowed users to register `OutgoingWebhooks`, firing off `POST` requests whenever a predefined action (like post-success) occurs.

### Phase 5: Distributed Queues & Notifications (2026-02-24)
- **Custom Postgres Queue**: Specifically avoided Redis for the MVP version to reduce infrastructure complexity. Created a `PublishJob` table. Scheduled an internal polling worker on `/api` that queries for `PENDING` states, locks them with a highly concurrent randomized delay, processes them, and clears them.
- **Exponential Backoff**: Integrated retry counts with exponentially increasing delays for API failures from target networks (e.g., rate-limits from X or Facebook).
- **Support Inbox**: Constructed a threaded ticket architecture for users to contact platform administrators.

### Phase 6: Unified Inbox & CRM Leads (2026-02-24)
- **Data Intake Pipeline**: Overhauled the `/api/webhooks/ingest` handler to serve as the unified entry point for all incoming external payload data from standard social media APIs.
- **Automatic Lead Generation**: Modified the ingestion system to automatically map commenters to the internal CRM (`Lead` model) and track their lifetime engagements.
- **Inbox Messaging**: Added the `InboxMessage` table tracking read-receipts dynamically, giving social media managers a solitary view of unread notifications from all networks.

### Phase 7: Interactive Developer/User Manuals (2026-02-24)
- **React Markdown**: Integrated real-time parsing into NextJS via `react-markdown` and `remark-gfm` to visualize internal GitHub-flavored styling, anchor links, tables, and quotes.
- **Unified Documentation**: Authored `USER_MANUAL.md` and `ADMIN_GUIDE.md` and injected them natively inside the dashboard sidebars. 

### Phase 8: Google Identity & Platform Security (2026-02-25)
- **OAuth Infrastructure**: Bound Passport.js with the `google-oauth20` strategy inside the `AuthController`. Modified `passwordHash` to accept NULL integers in Prisma, establishing secure multi-factor or magic-login capabilities for the future.
- **Admin Root Console**: Erected the `/admin` prefix across front and backend systems governed by a strict RBAC policy guard. Integrated API status monitoring, comprehensive read-only `AuditLogs`, and dynamic UI logic for `FeatureFlag` state flipping.

### Phase 12: Brand Identity & UI Polish (2026-04-27)
- **Brand Color Pivot**: Replaced generic indigo `#4F6EF7` with the app icon's native colors — orange `#E06028` as primary action color, blue `#4B8EC4` as secondary. All CSS custom properties updated in `globals.css`; Tailwind config extended with `brand.secondary`. Logo icon colors now drive the entire design system.
- **Page Title Accent**: `.page-title` CSS class updated to render in `--brand-secondary` (blue `#4B8EC4`) instead of inherited white. Applied globally across all 21 dashboard pages with zero per-page changes.
- **Logo & Wordmark Refinement**: App icon display size increased 32→40px with 10px border radius. Wordmark switched to Plus Jakarta Sans 800 weight with `-0.03em` tracking. Logo div made clickable (navigates home).
- **Light/Dark Theme Toggle**: Installed `next-themes`. `ThemeProvider` wraps root layout with `defaultTheme="dark"`, `attribute="class"`. `.light` CSS override block added to `globals.css` (white `#FFFFFF` bg, `#1a1a2e` text, all surfaces mapped). `ThemeToggle` component (sun/moon SVG icons) added to sidebar footer above logout button. Theme preference persists via `localStorage`.
- **Custom Nav Icons (21)**: All lucide-react nav icons replaced with bespoke inline SVG components in `components/nav-icons.tsx`. 1.5px stroke, `fill="none"`, 24×24 viewBox. Each icon is iconographically distinctive — not generic lucide defaults. AI Studio = neural constellation nodes, Analytics = dotted trend line, Subscription = gem/diamond, Support = headset, Approvals = shield+check, etc.
- **Welcome Home Page**: `/dashboard` permanently redesigned. Time-aware greeting (Good morning/afternoon/evening + first name from JWT), 3 quick-action cards (Create Post, Connect Account, Browse Templates) with orange/blue accent borders and hover lift animation, 3-stat strip (Total/Scheduled/Published), recent posts feed with status dots and row hover. Empty state prompts "Create your first post."
- **Docker Infra Fixes (pre-existing bugs surfaced by rebuild)**:
  - `apps/api/Dockerfile` CMD corrected: TypeScript with no explicit `rootDir` outputs to `dist/src/main.js` not `dist/main.js`.
  - Docker base image upgraded `node:18-alpine` → `node:20-alpine`: `@nestjs/schedule` uses `crypto.randomUUID()` which requires Node ≥19 as a global.
  - `REDIS_URL=redis://redis:6379` added to docker-compose API environment; `depends_on: redis` added to ensure startup order.
- **Nginx DNS Fix**: Added `resolver 127.0.0.11 valid=10s` + `set $upstream` variables to nginx config. Forces per-request DNS resolution so container IP changes after rebuilds don't cause 502s.
- **Merged to main**: Branch `reliability/phase-11` merged and pushed. Production containers rebuilt and healthy.

### Phase 11: Publishing Reliability Infrastructure (2026-04-27)
- **Root Cause Analysis Applied**: Implemented all 8 failure modes identified in `docs/research/RELIABILITY_RESEARCH.md`. Every architectural decision grounded in competitor failure analysis (Publer, Content360, SocialBee, Metricool).
- **TokenHealthModule**: NestJS cron job runs every 4 hours. Proactively checks all SocialAccount tokens. Sets `tokenStatus` to `TOKEN_EXPIRING` (7 days), `TOKEN_CRITICAL` (3 days), or `TOKEN_EXPIRED`. Sends notifications at each transition. Blocks publish jobs (`BLOCKED` status) on expiry. Auto-unblocks all held jobs when user reconnects account.
- **Error Classifier**: Pure function classifies any HTTP/network error into `ErrorClass` enum — `PERMANENT` (400/403/404/410/422 — never retry), `TOKEN_EXPIRED` (401 — BLOCKED, not FAILED), `RATE_LIMIT` (429 — honor Retry-After header), `TRANSIENT` (408/5xx/network — exponential backoff with jitter), `UNKNOWN`. 17 unit tests.
- **Smart Retry**: `PublishQueueService` catch block replaced with error-classified logic. `errorClass` persisted on every job failure. TOKEN_EXPIRED → `BLOCKED` (job preserved for reconnect). Permanent errors never retried. Transients use `retryDelayMs()` (base 2min, max 24hr, jitter). `PUBLISH_BLOCKED` notification sent immediately on block.
- **Per-Platform Queue Isolation**: `processJobsForPlatform()` added to `PublishQueueService`. Worker uses `Promise.allSettled` over all 6 platforms — one Instagram failure never delays Twitter/LinkedIn jobs. `runJob()` extracted as private method for reuse.
- **Pre-flight Media Validation**: `FfprobeService` wraps `fluent-ffmpeg` to probe video codec/duration/aspect ratio/resolution at upload time. `platform-requirements.json` is live config (not hardcoded — update without deploys). `MediaValidationService` returns per-platform `PASS`/`WARN`/`FAIL` with human-readable issue strings. Stored as asset tag `validation:INSTAGRAM=PASS,...`. 8 unit tests.
- **Rate Limit Manager**: `RateLimitService` provides `withinDailyLimit()` and `computeStaggeredTimes()`. Platform-specific daily limits (Instagram: 25, TikTok: 10, LinkedIn: 150) and minimum spacing (Instagram: 120s, TikTok: 300s). Prevents thundering herd on bulk upload days. 9 unit tests.
- **Post-Publish Verification**: `scheduleVerification()` fires 30 seconds after every successful publish. If `verifyPublished()` returns false, job → `VERIFY_FAILED` + notification. Base implementation trusts 2xx (real platform services will override `verifyPublished()` per platform).
- **BullMQ Integration**: `enqueueBull()` added alongside existing Postgres queue. Uses Redis delayed jobs for millisecond-precision scheduling vs. 15-second polling. `BullQueueModule` registers 8 per-platform queues. Graceful fallback to Postgres `enqueue()` if Redis unavailable. Redis added to `docker-compose.prod.yml`. `REDIS_URL=redis://localhost:6379` in `.env.example`.
- **Schema Changes**: `TokenStatus` enum (5 values), `ErrorClass` enum (6 values), `BLOCKED` + `VERIFY_FAILED` added to `JobStatus`, `tokenStatus` on `SocialAccount` (default ACTIVE), `errorClass` on `PostPublishJob` (nullable). 5 new `NotificationType` values.
- **Jobs Dashboard**: `/dashboard/jobs` rebuilt with filter tabs (All/Active/Failed/Blocked), error class labels, `Reconnect` button for BLOCKED jobs, `▶ Now` retry for VERIFY_FAILED. `AccountHealthDot` updated to use persisted `tokenStatus` field (legacy `tokenExpiresAt` fallback retained).
- **Sidebar Logo**: App icon (`assets/app_icon_upscaled_4096.png`) as 32px rounded icon. `1Place2Post` wordmark as one unit — `1`/`2` in orange (#E06028), `Place`/`Post` in blue (#4B8EC4) — matching icon brand colors.
- **PR**: Open at https://github.com/techstruction/1Place2Post/pull/1 on branch `reliability/phase-11`. Not yet merged. Containers not yet rebuilt.
- **Test Coverage**: 86/88 tests passing (2 pre-existing Instagram scaffold failures unchanged). TypeScript clean on both `apps/api` and `apps/web`.

### Phase 10: Design System & UI Overhaul (2026-04-24)
- **Competitive Research**: Completed deep analysis of direct competitors: Publer (primary), Content360, SocialBee, and Metricool. Identified Publer as the benchmark — $3M ARR, 350K users, $12/mo entry — and confirmed 1Place2Post has already built features Publer has deliberately never shipped (Unified Inbox, CRM pipeline, Bot Rules).
- **Target Persona Confirmed**: Small creator teams, 2–10 people (boutique social media managers, creator businesses, small agencies). Structurally underserved by all major tools due to per-seat/per-account pricing cliffs.
- **Design Direction Set**: Blue accent (#4F6EF7) replacing purple (#7c5cfc). Dark sidebar (#181B20). Inter + Plus Jakarta Sans typography. 13px compact density. Lucide icons replacing emoji navigation. shadcn/ui component library adoption decision made.
- **Phase Roadmap Revised**: Original Phase 9 (Testing) deprioritized — testing before billing and UX polish is premature. New sequence: Design System (10) → Feature Polish (11) → Billing/Stripe (12) → Testing (13) → Scale (14) → AI (15).
- **Three Positioning Pillars Locked**: (1) "Posts that actually post" — publish reliability as product promise; (2) "Real team tools at creator prices" — flat pricing with genuine seat/account counts; (3) "Social media that grows your business" — comment-to-DM-to-lead-to-customer pipeline.
- **Pricing Strategy Confirmed**: Starter $19/mo (1 user, 7 accounts), Team $49/mo (5 users, 20 accounts), Agency $99/mo (15 users, unlimited accounts). All features at all tiers — no gating.
- **Launch Blocker Identified**: Stripe Billing integration required before public launch (Phase 12).
- **Tech Debt Catalogued**: Tailwind CSS installed but unconfigured; no shared component library (2 components for 30+ pages); local disk storage must migrate to Cloudflare R2; JWT in localStorage is medium-priority security improvement.
