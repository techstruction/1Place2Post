# 1Place2Post — Handoff Document

> Current state, architecture decisions, strategic direction, and next steps for any agent or developer picking this up.

---

## Production Status (as of 2026-04-28)

**Version:** v0.11.0
**Branch:** `main` — merged locally, **not yet pushed to origin or rebuilt in production**
**Repo:** `github.com/techstruction/1Place2Post`
**URL:** `https://1place2post.techstruction.co`
**Server:** Oracle Cloud Ubuntu 22.04 ARM64 (`openbrain-node-01` / `100.101.15.109` via Tailscale)

Phases 0–13a are complete on `main`. **Production containers have NOT been rebuilt for Phase 13a yet** — the schema migration (`workspace_architecture`) has been applied to the live DB via `prisma migrate deploy`, but the API and web containers are still running Phase 12 code. Rebuild required before Phase 13b begins.

**Rebuild command (run before starting 13b):**
```bash
cd /home/ubuntu/1P2P-main
GIT_SSH_COMMAND="ssh -i ~/.ssh/github_tc" git push origin main
docker compose -f deploy/docker-compose.prod.yml up -d --build
docker exec 1p_nginx nginx -s reload
```

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
| `1p_api_prod` | 35763 | `deploy/docker-compose.prod.yml` | NestJS API (Node 20) |
| `deploy-redis-1` | 6379 (internal) | `deploy/docker-compose.prod.yml` | Redis for BullMQ |
| `postgres` | 5432 | `server-bc/services/postgres/` | Shared DB; user is `1p2p` |

All containers are on the shared `proxy` Docker network. Nginx routes `/api/*` to the NestJS backend and everything else to the Next.js frontend.

**Rebuild command:**
```bash
cd /home/ubuntu/1P2P-main
docker compose -f deploy/docker-compose.prod.yml up -d --build
docker exec 1p_nginx nginx -s reload   # re-resolves container DNS after rebuild
```

---

## Design Direction

Full spec: `docs/DESIGN_SYSTEM.md`

### Brand Colors (Phase 12 — updated from indigo)
| Token | Value | Usage |
|---|---|---|
| `--brand-500` | `#E06028` | Primary orange — buttons, active nav, highlights |
| `--brand-400` | `#F07038` | Orange hover variant |
| `--brand-600` | `#C85020` | Orange pressed/active |
| `--brand-secondary` | `#4B8EC4` | Logo blue — page titles, links, secondary elements |

### Design Tokens
- **Background:** `#0a0a0f` base, `#13131a` card, `#181B20` sidebar
- **Typography:** Inter (`--font-ui`), Plus Jakarta Sans (`--font-display`). 13px base.
- **Components:** shadcn/ui 18 components in `components/ui/`. Custom: `AccountHealthDot`, `PostStatusBadge`, `SkeletonCard`, `PublishFailureBanner`, `ThemeToggle`, nav-icons.
- **Icons:** Custom SVG components in `components/nav-icons.tsx` (21 icons, 1.5px stroke line art). Lucide used only for utility icons (LogOut, ChevronLeft, ChevronRight).
- **Theme:** Light/dark toggle via `next-themes`. `defaultTheme="dark"`. `.light` CSS class overrides all surface vars. Toggle in sidebar footer.
- **Sidebar:** 220px expanded, 64px collapsed. Account health dots below nav. Theme toggle + logout at bottom.

---

## Key Architecture Decisions

See `LEDGER.md` for the full chronological record. Key decisions:

- **Postgres-backed publish queue** — `PublishJob` table with polling worker. BullMQ + Redis added in Phase 11 as optional layer (`enqueueBull()` with Postgres fallback).
- **REDIS_URL must be `redis://redis:6379`** — Docker service hostname, not `localhost`. Set in `docker-compose.prod.yml` environment.
- **API Dockerfile CMD** — `node dist/src/main.js` (not `dist/main.js`). TypeScript without explicit `rootDir` preserves source directory structure in output.
- **Node 20 required** — `@nestjs/schedule` uses `crypto.randomUUID()` global (Node 19+). API Dockerfile uses `node:20-alpine`.
- **Nginx DNS resolver** — `resolver 127.0.0.11 valid=10s` + `set $upstream` variables force per-request DNS re-resolution. Without this, container IP changes after rebuilds cause 502s until nginx is manually reloaded.
- **Local disk uploads** — Multer saves to `/uploads/*` inside API container. Cloudflare R2 migration planned for Phase 16.
- **Workspace model (Phase 13a)** — All resources scoped to a `Workspace`, not individual users. `Team`/`TeamMember`/`TeamRole` fully replaced. `SocialAccount.workspaceId` required — accounts belong to the workspace, not the connecting user. Users can own or join multiple workspaces. Active workspace stored client-side in `localStorage['1p2p_activeWorkspace']` and passed as `workspaceId` query param to all OAuth initiation endpoints.
- **WorkspaceRole tiers** — OWNER | ADMIN | SUPERVISOR | MEMBER. Only OWNER can change roles or transfer ownership. OWNER/ADMIN can invite/remove members.
- **OAuth state carries workspaceId** — Instagram, Twitter, LinkedIn `getAuthUrl(userId, workspaceId)`. State is base64 JSON `{ userId, workspaceId }`. Callback uses `workspaceId_platform_platformId` unique key for upsert.
- **Platform enum expanded** — THREADS and TELEGRAM added (ready for Phase 13b services).
- **User.onboardingCompletedAt** — nullable DateTime. Null = needs onboarding wizard. Set at wizard completion. Auth response includes `needsOnboarding: boolean`.
- **Postgres DB user is `1p2p`** — not the default `postgres`.
- **Google OAuth via Passport.js** — `passwordHash` is nullable for passwordless paths.
- **ARM64 server** — all Docker images must be ARM64-compatible. `node:20-alpine` is ARM64-compatible.
- **shadcn/ui adoption** — Tailwind v4 + Radix UI. `components.json` + `tailwind.config.ts` + `lib/utils.ts` in place. 18 shadcn components installed.
- **Tailwind v4 @config path** — `globals.css` is in `app/`. Path is `@config "../tailwind.config.ts"` — relative to CSS file, not package root.

---

## Monorepo Structure

```
apps/
  api/        — NestJS backend (port 35763 internally, Node 20)
  web/        — Next.js frontend (port 3000 internally)
deploy/
  docker-compose.prod.yml   — API + Web + Redis
  docker-compose.nginx.yml  — Nginx reverse proxy
  nginx/
    1place2post.conf         — Docker DNS resolver + upstream vars
directives/   — SOPs for AI agent operations (see AGENTS.md / CLAUDE.md)
execution/    — Deterministic Python scripts
docs/
  LEDGER.md         — Architectural decisions log
  ROADMAP.md        — Phase milestones
  ANNEALING.md      — Lessons learned / mistakes log
  NORTH_STAR.md     — Product vision, positioning, target persona
  DESIGN_SYSTEM.md  — Token spec, component inventory, typography
  research/         — Competitive research files
assets/
  app_icon_upscaled_4096.png  — Master app icon (mirrored to apps/web/public/logo.png)
```

---

## What's Next

See `ROADMAP.md` for full phase breakdown.

**Phase 13b — Onboarding Wizard & Platform Connections (IMMEDIATE NEXT):**
- Plan: `docs/superpowers/plans/2026-04-28-13b-onboarding-connections.md`
- 4-step onboarding wizard at `/onboarding/` (role → workspace → platforms → get started)
- Platform grid (Publer-style) — all platforms shown, Coming Soon for LinkedIn/Pinterest/Bluesky/Mastodon/Snapchat
- New OAuth services: Facebook Pages, Threads, YouTube, TikTok
- Telegram bot-token connection (no OAuth — @BotFather token + channel username)
- `/dashboard/connections` redesigned with platform grid
- QuickStart / Getting Started section on dashboard
- Auth flow: register/login returns `needsOnboarding` → redirect to `/onboarding/step-1`

**Phase 13c — Feature Completeness & Polish:**
- Calendar: drag-and-drop rescheduling
- Post composer: media upload UX, platform character counters, hashtag suggestions
- Bulk scheduling (CSV import)
- AI Studio: caption generation
- Analytics: chart visualizations

**Phase 14 — Billing & Monetization (LAUNCH BLOCKER):**
- Stripe Billing (subscriptions, trials, upgrades, downgrades)
- Stripe Customer Portal (1-click cancel, plan changes)
- Subscription enforcement middleware
- Pricing page (public)

**Phase 15 — Testing & QA:**
- Unit + integration tests
- E2E Playwright tests
- Security: JWT fuzzing, OAuth integrity, subscription gate tests

**Phase 16 — Scale & Reliability:**
- Cloudflare R2 storage migration
- NestJS Throttler rate limiting
- CDN for static assets

**Phase 17 — AI Agents:**
- LLM-powered DM auto-replies
- Sentiment analysis for inbox routing
- Smart scheduling suggestions

---

## Launch Criteria

- [x] Phase 10 complete (UI design system shipped)
- [x] Phase 11 complete (reliability infrastructure — "posts that actually post")
- [x] Phase 12 complete (brand identity, UI polish, production rebuilt)
- [x] Phase 13a complete (workspace architecture — merged to main, DB migrated, rebuild pending)
- [ ] Phase 13b complete (onboarding wizard + 5 new platform connections)
- [ ] Phase 14 complete (Stripe billing live)
- [ ] Phase 15 in progress (core tests passing)
- [ ] Publish success rate ≥ 99% over 30-day window (requires real platform API integration)
- [ ] Pricing page live
- [ ] Onboarding: signup → connect account → schedule first post in ≤ 5 min

---

## Gotchas

- **Postgres user is `1p2p`**, not `postgres`
- **ARM64 server** — all Docker base images must support ARM64. `node:20-alpine` is safe.
- **API Docker CMD** — `node dist/src/main.js` (not `dist/main.js`). TypeScript outputs to `dist/src/` when no `rootDir` is set.
- **Node 20 required** — `@nestjs/schedule` and several other packages require Node ≥19 for `crypto.randomUUID()` global.
- **REDIS_URL in Docker** — must be `redis://redis:6379` (service hostname), not `localhost`. Set in `docker-compose.prod.yml`.
- **After any container rebuild** — run `docker exec 1p_nginx nginx -s reload` to re-resolve DNS. The nginx config now has `resolver 127.0.0.11` for automatic future re-resolution, but a manual reload is still good practice.
- **Port 7432** — Command Center dashboard on same server. Do not use for 1P2P test servers.
- **`proxy` Docker network** — external, shared by all services. Create with `docker network create proxy` if missing.
- **Tailwind v4 @config path** — `@config "../tailwind.config.ts"` in `app/globals.css`. Path is relative to the CSS file, not the package root.
- **shadcn/ui + class-variance-authority** — after `npx shadcn@latest add`, verify `class-variance-authority` is in `package.json`. CLI skips it for Tailwind v4 projects.
- **`.env.example` gitignore** — use `git add -f` to stage `.env.example` files (`.env.*` pattern in `.gitignore` catches them).
- **Test baseline** — 96/98 tests passing (86 original + 10 new workspace tests). 2 pre-existing failures in Instagram scaffold (`instagram.service.spec.ts`, `instagram.controller.spec.ts`). Not regressions.
- **Workspace active state** — stored in `localStorage['1p2p_activeWorkspace']` on the frontend. Sidebar fetches `/workspaces/mine` on load to populate the workspace switcher. Pass `workspaceId` in all OAuth initiation URLs.
- **next-themes hydration** — `suppressHydrationWarning` must be on `<html>` element in `layout.tsx`. Without it, React throws a hydration mismatch for the `class` attribute injected by next-themes.
