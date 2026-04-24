# 1Place2Post — Handoff Document

> Current state, architecture decisions, strategic direction, and next steps for any agent or developer picking this up.

---

## Production Status (as of 2026-04-24)

**Version:** v0.9.0
**Branch:** `main` — up to date with `origin`
**Repo:** `github.com/techstruction/1Place2Post`
**URL:** `http://1place2post.techstruction.co`
**Server:** Oracle Cloud Ubuntu 22.04 ARM64 (`openbrain-node-01` / `100.101.15.109` via Tailscale)

All phases 0–10 are complete. Phase 11 (Feature Completeness & Polish) is the immediate next build.

---

## North Star

**What we're building:** The first social media management platform that treats reliability, billing honesty, and small-team collaboration as the product itself — not upsell tiers.

**Three Positioning Pillars:**
1. **"Posts that actually post"** — Silent publishing failures are the #1 complaint across every competitor. Own reliability visibly: publish success rate on pricing page, prominent failure alerts, per-post publish logs, isolated job handling (one failed post never stalls others).
2. **"Real team tools at creator prices"** — Flat pricing. Approvals, inbox, CRM, role-based access at the $19/mo Starter tier. Not gated.
3. **"Social media that grows your business"** — Bot rules + unified inbox + CRM pipeline = comment-to-DM-to-customer funnel. We are the only tool in the Publer price band with all three.

**Target Customer:** Small creator teams, 2–10 people. Boutique social media managers, creator businesses, small-to-mid agencies. Paying $50–150/mo for current tools and constantly fighting per-account pricing escalation.

**Direct Competitor:** Publer ($3M ARR, 350K users, $12/mo, bootstrapped). Excellent at scheduling. Deliberately never built inbox, CRM, or bot rules. Their users leave for Agorapulse ($299/mo) just to get a unified inbox. 1Place2Post fills that exact gap at $19–$99/mo.

Full vision: `docs/NORTH_STAR.md`

---

## Pricing Strategy

| Plan | Users | Accounts | Price | Notes |
|---|---|---|---|---|
| Starter | 1 | 7 | $19/mo | All features, no gating |
| Team | 5 | 20 | $49/mo | Full approvals, roles, inbox |
| Agency | 15 | Unlimited | $99/mo | All team features at scale |

**Billing principles:** 30-day pre-renewal reminder. 1-click cancellation. Prorated refunds. Grandfathered pricing for existing subscribers. No hidden per-account math.

---

## Running Services

| Container | Internal Port | Compose File | Notes |
|---|---|---|---|
| `1p_nginx` | 80 (public) | `deploy/docker-compose.nginx.yml` | Nginx reverse proxy |
| `1p_web_prod` | 3000 | `deploy/docker-compose.prod.yml` | Next.js frontend |
| `1p_api_prod` | 35763 | `deploy/docker-compose.prod.yml` | NestJS API |
| `postgres` | 5432 | `server-bc/services/postgres/` | Shared DB; user is `1p2p` |

All containers are on the shared `proxy` Docker network. Nginx routes `/api/*` to the NestJS backend and everything else to the Next.js frontend.

---

## Design Direction

Full spec: `docs/DESIGN_SYSTEM.md`

- **Color:** Blue accent `#4F6EF7`. Dark sidebar `#181B20`. Background `#0a0a0f`. All tokens live in `globals.css` `:root` block. Legacy aliases (`--accent`, `--text`, `--bg`, etc.) forward to canonical names for backward compat.
- **Typography:** Inter (UI, `--font-ui`), Plus Jakarta Sans (display, `--font-display`). 13px base font. Lora and Poppins removed.
- **Components:** shadcn/ui 18 components in `components/ui/`. 6 custom components in `components/`. `cn()` helper in `lib/utils.ts`.
- **Icons:** Lucide icons throughout. Note: lucide-react removed brand social icons (Instagram, Facebook etc.) — `PlatformBadge` uses generic substitutes with correct brand colors.
- **Sidebar:** 220px fixed, 64px collapsed. Background `--bg-sidebar: #181B20`. Account health dots below nav.
- **Reliability signals:** `PublishFailureBanner` in dashboard layout fetches `/api/publish-jobs?status=FAILED&acknowledged=false`.

---

## Key Architecture Decisions

See `LEDGER.md` for the full chronological record. Key decisions:

- **No Redis for MVP queue** — Postgres-backed `PublishJob` table with polling worker and exponential backoff. Redis/BullMQ planned for Phase 14.
- **Local disk uploads** — Multer saves to `/uploads/*` inside the API container. Cloudflare R2 migration planned for Phase 14.
- **B2B team model** — All resources (posts, templates, assets) are scoped to a `Team`, not individual users.
- **Postgres DB user is `1p2p`** — not the default `postgres`.
- **Google OAuth via Passport.js** — `passwordHash` is nullable to support passwordless login paths.
- **ARM64 server** — all Docker images must be ARM64-compatible. Do not switch to alpine variants.
- **shadcn/ui adoption** — Tailwind v4 + Radix UI. Done in Phase 10. `components.json` + `tailwind.config.ts` + `lib/utils.ts` in place. 18 shadcn components installed.
- **Tailwind v4 @config path** — `globals.css` lives in `app/`. The `@config` directive path is relative to the CSS file: `@config "../tailwind.config.ts"` (note the `..`). Easy to get wrong; the production build will fail silently if the path is wrong.

---

## Monorepo Structure

```
apps/
  api/        — NestJS backend (port 35763 internally)
  web/        — Next.js frontend (port 3000 internally)
deploy/
  docker-compose.prod.yml
  docker-compose.staging.yml
  docker-compose.nginx.yml
  nginx/
    1place2post.conf
directives/   — SOPs for AI agent operations (see AGENTS.md / CLAUDE.md)
execution/    — Deterministic Python scripts
docs/
  LEDGER.md         — Architectural decisions log (mirrored from root)
  ROADMAP.md        — Phase milestones (mirrored from root)
  NORTH_STAR.md     — Product vision, positioning, target persona
  DESIGN_SYSTEM.md  — Token spec, component inventory, typography
  research/         — Competitive research files and screenshots
```

---

## What's Next

See `ROADMAP.md` for full phase breakdown.

**Phase 10 — Design System & UI Overhaul (COMPLETE 2026-04-24):**
- ✅ shadcn/ui + Radix UI + Tailwind v4 fully configured (`components.json`, `tailwind.config.ts`, `lib/utils.ts`)
- ✅ Blue accent #4F6EF7 replacing legacy purple #7c5cfc everywhere
- ✅ Lucide icon navigation (21 items) replacing emoji
- ✅ Post composer rebuilt as two-column layout with live platform preview + character counters
- ✅ Inbox redesigned as 3-panel layout (platform filter | thread list | thread view) with sentiment badges
- ✅ Account health indicators in sidebar (green/amber/red dots from `/api/social-accounts`)
- ✅ Global failure banner (fetches failed publish jobs, dismissible)
- ✅ Skeleton loading in dashboard overview (stat cards + table rows)
- ✅ Sidebar 220px (down from 240px), collapsed 64px (down from 80px), bg `#181B20`
- ✅ Inter + Plus Jakarta Sans typography, 13px base font-size
- ✅ Zero undefined CSS variable references across all `.tsx` files

**Remaining work NOT completed in Phase 10 (roll into Phase 11):**
- Skeleton loading on all other dashboard pages (only `dashboard/page.tsx` done; 20 pages remain)
- Inbox reply sending is stubbed — Send Reply button renders but doesn't call an API
- Publish Queue page prominence improvements

**Phase 11 — Feature Completeness & Polish (IMMEDIATE NEXT):**
- Calendar drag-and-drop rescheduling
- Bulk operations (multi-select posts, CSV import)
- AI Studio caption generation (Anthropic claude-haiku-4-5)
- Analytics chart visualizations (line/bar engagement)
- Mobile-responsive layouts (full, not just sidebar collapse)
- Skeleton loading for all remaining dashboard pages
- Inbox reply sending wired to platform APIs
- Hashtag suggestions in composer
- Form validation consistency across all forms

**Phase 12 — Billing & Monetization (Launch Blocker):**
- Stripe Billing (subscriptions, trials, upgrades, downgrades)
- Stripe Customer Portal (1-click cancel, plan changes)
- Pricing page (public)
- Subscription enforcement middleware

**Phase 13 — Testing & QA:**
- Unit + integration tests (NestJS)
- E2E Playwright tests
- Security: JWT fuzzing, OAuth integrity
- Visual regression

**Phase 14 — Scale & Reliability:**
- NestJS Throttler rate limiting
- Cloudflare R2 storage migration
- Redis/BullMQ job queue

**Phase 15 — AI Agents:**
- LLM-powered DM auto-replies (Anthropic API)
- Sentiment analysis for inbox routing
- Smart scheduling suggestions

**Phase 16 — Enterprise & Ecosystem:**
- SAML/SSO, Public API, Mobile App

---

## Launch Criteria

- [ ] Phase 10 complete (UI is beautiful and usable)
- [ ] Phase 12 complete (Stripe billing live)
- [ ] Phase 13 in progress (core tests passing)
- [ ] Publish success rate ≥ 99% over 30-day window
- [ ] Pricing page live
- [ ] Onboarding: signup → connect account → schedule first post in ≤ 5 min

---

## Gotchas

- Postgres user is `1p2p`, not `postgres`
- ARM64 server — do not change Docker base images to alpine variants
- Port 7432 is the Command Center dashboard on the same server — don't use it for 1P2P test servers
- The `proxy` Docker network is external and shared; create it with `docker network create proxy` if missing
- `n8n_data/config` (56 bytes) excluded from OneDrive backup — n8n regenerates automatically
- Tailwind v4 configured: `tailwind.config.ts` exists, `@config "../tailwind.config.ts"` in `app/globals.css` (path is relative to CSS file, not package root)
- shadcn/ui initialized: `components.json` present, 18 components in `components/ui/`, `lib/utils.ts` with `cn()` helper
- `class-variance-authority` must be listed as a dependency — shadcn CLI does not auto-install it for Tailwind v4 projects
