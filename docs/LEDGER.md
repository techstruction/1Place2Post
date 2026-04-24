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

### Phase 9: Strategic Research & Competitive Analysis (2026-04-24)
- **Competitive Research**: Completed deep analysis of direct competitors: Publer (primary), Content360, SocialBee, and Metricool. Identified Publer as the benchmark — $3M ARR, 350K users, $12/mo entry — and confirmed 1Place2Post has already built features Publer has deliberately never shipped (Unified Inbox, CRM pipeline, Bot Rules).
- **Target Persona Confirmed**: Small creator teams, 2–10 people (boutique social media managers, creator businesses, small agencies). Structurally underserved by all major tools due to per-seat/per-account pricing cliffs.
- **Design Direction Set**: Blue accent (#4F6EF7) replacing purple (#7c5cfc). Dark sidebar (#181B20). Inter + Plus Jakarta Sans typography. 13px compact density. Lucide icons replacing emoji navigation. shadcn/ui component library adoption decision made.
- **Phase Roadmap Revised**: Original Phase 9 (Testing) deprioritized — testing before billing and UX polish is premature. New sequence: Design System (10) → Feature Polish (11) → Billing/Stripe (12) → Testing (13) → Scale (14) → AI (15).
- **Three Positioning Pillars Locked**: (1) "Posts that actually post" — publish reliability as product promise; (2) "Real team tools at creator prices" — flat pricing with genuine seat/account counts; (3) "Social media that grows your business" — comment-to-DM-to-lead-to-customer pipeline.
- **Pricing Strategy Confirmed**: Starter $19/mo (1 user, 7 accounts), Team $49/mo (5 users, 20 accounts), Agency $99/mo (15 users, unlimited accounts). All features at all tiers — no gating.
- **Launch Blocker Identified**: Stripe Billing integration required before public launch (Phase 12).
- **Tech Debt Catalogued**: Tailwind CSS installed but unconfigured; no shared component library (2 components for 30+ pages); local disk storage must migrate to Cloudflare R2; JWT in localStorage is medium-priority security improvement.
