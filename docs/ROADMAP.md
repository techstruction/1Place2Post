# 1Place2Post — Product Roadmap

> Living document. Update phase status as work completes.

---

## Completed Phases

| Phase | Name | Completed |
|---|---|---|
| 0 | Monorepo Foundation | 2026-02-23 |
| 1 | Authentication & Core Publishing | 2026-02-23 |
| 2 | Link Pages & Bot Engines | 2026-02-24 |
| 3 | Media Uploads & Team Workspaces | 2026-02-24 |
| 4 | Approvals & Outgoing Webhooks | 2026-02-24 |
| 5 | Distributed Queues & Notifications | 2026-02-24 |
| 6 | Unified Inbox & CRM Leads | 2026-02-24 |
| 7 | Interactive Developer Manuals | 2026-02-24 |
| 8 | Google Identity & Platform Security | 2026-02-25 |
| 9 | Strategic Research & Competitive Analysis | 2026-04-24 |
| 10 | Design System & UI Overhaul | 2026-04-24 |
| 11 | Publishing Reliability Infrastructure | 2026-04-27 |
| 12 | Brand Identity & UI Polish | 2026-04-27 |
| 13a | Workspace Architecture Migration | 2026-04-28 |
| 13b | Onboarding Wizard & Platform Connections | 2026-04-28 |

---

## Active & Upcoming Phases

### Phase 13c — Platform OAuth Credentials Setup ← IMMEDIATE NEXT (non-code)
**Status:** 🟡 In progress — code shipped, credentials pending
**Goal:** Register developer apps for Threads and TikTok, add production redirect URIs for Facebook/YouTube, verify all 7 platform connections end-to-end.

**Plan:** `docs/superpowers/plans/2026-04-28-platform-oauth-setup.md`

**Deliverables:**
- Facebook Pages redirect URI registered in Meta developer console
- Threads API product added to Meta app + `THREADS_CLIENT_ID`/`SECRET`/`REDIRECT_URI` in `.env`
- YouTube Data API v3 enabled + `YOUTUBE_REDIRECT_URI` in `.env`
- TikTok developer app created + `TIKTOK_CLIENT_KEY`/`SECRET`/`REDIRECT_URI` in `.env`
- End-to-end connection test for all 7 platforms
- Note: Threads + TikTok require **App Review** for production use. 1–2 week timeline for approval.

**To do this:** This is a manual task (clicking through developer consoles, copying credentials). The plan at `docs/superpowers/plans/2026-04-28-platform-oauth-setup.md` has step-by-step instructions for each platform.

---

### Phase 13d — Feature Completeness & Polish
**Status:** ⚪ Planned
**Goal:** Close the feature gaps identified in the UX audit and competitive research.

**Deliverables:**
- Calendar: drag-and-drop rescheduling
- Post composer: media upload UX, platform character counters, hashtag suggestions
- Bulk scheduling (CSV import or multi-select)
- AI Studio: caption generation (Anthropic claude-haiku-4-5)
- Analytics: chart visualizations (line/bar for engagement over time)
- Lead pipeline: Kanban drag-and-drop
- Mobile-responsive layouts (full, not just sidebar collapse)
- Skeleton loading screens on remaining 18 dashboard pages (only overview done)
- Form validation: consistent client-side patterns across all forms

---

### Phase 14 — Billing & Monetization ⚠ LAUNCH BLOCKER
**Status:** ⚪ Planned
**Goal:** Stripe integration enabling paid subscriptions. Cannot acquire real paying customers without this.

**Deliverables:**
- Stripe Billing: subscription creation, plan changes, trial periods
- Stripe Customer Portal: self-serve cancellation, plan upgrades/downgrades
- Subscription enforcement middleware (API gates features by active plan)
- Pricing page (public, no login required)
- Pre-renewal email (30-day reminder via Resend)
- Grandfathered pricing mechanism (never raise prices on existing subscribers)
- Webhook handler for Stripe events (payment failed, subscription cancelled, etc.)

**Pricing tiers:**
| Plan | Users | Accounts | Price |
|---|---|---|---|
| Starter | 1 | 7 | $19/mo |
| Team | 5 | 20 | $49/mo |
| Agency | 15 | Unlimited | $99/mo |

---

### Phase 15 — Testing & QA (Stage I)
**Status:** ⚪ Planned
**Goal:** Establish confidence in correctness before scaling traffic.

**Deliverables:**
- Unit tests: auth, post CRUD, bot rules, RSS parsing
- Integration tests: publish queue, inbox ingestion, webhook dispatch
- E2E Playwright: create-post, inbox thread, link-in-bio, bot rule trigger
- Visual regression: key dashboard pages
- Security: JWT scope tests, OAuth flow integrity, subscription gate tests

---

### Phase 16 — Scale & Reliability (Remaining)
**Status:** ⚪ Planned

**Deliverables:**
- NestJS Throttler rate limiting
- Cloudflare R2 migration (replace local disk uploads — S3-compatible, ARM64-friendly)
- Redis + BullMQ (replace Postgres job queue)
- CDN for static assets
- Performance profiling + optimization

---

### Phase 17 — AI Agents
**Status:** ⚪ Planned

**Deliverables:**
- LLM-powered DM auto-replies (Anthropic claude-sonnet-4-6 with lead history context)
- Sentiment analysis for inbox routing (flag angry/urgent messages)
- Smart scheduling (ML-based optimal posting time suggestions)
- AI caption adaptation (one draft → per-platform variants)

---

### Phase 18 — Enterprise & Ecosystem
**Status:** ⚪ Planned (Future)

**Deliverables:**
- SAML/SSO (Okta, Entra ID)
- Granular custom permissions
- 2FA enforcement
- Public Developer API (Swagger/OpenAPI, rate-limited)
- Mobile App (React Native — Unified Inbox + Push Notifications)

---

## Launch Criteria

Before public launch / paid customer acquisition:
- [x] Phase 10 complete (UI design system shipped)
- [x] Phase 11 complete (reliability infrastructure — "posts that actually post")
- [x] Phase 12 complete (brand identity, UI polish, production rebuilt)
- [x] Phase 13a complete (workspace architecture — accounts belong to workspaces)
- [x] Phase 13b complete (onboarding wizard + 7 platform connection services)
- [ ] Phase 13c complete (Threads + TikTok OAuth credentials registered + all 7 platforms verified)
- [ ] Phase 14 complete (Stripe billing live)
- [ ] Phase 15 in progress (core tests passing)
- [ ] Publish success rate ≥ 99% over 30-day window (requires real platform API integration)
- [ ] Pricing page live
- [ ] Onboarding: signup → connect account → schedule first post in ≤ 5 min
