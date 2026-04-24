# 1Place2Post — Handoff Document

> Current state, architecture decisions, and next steps for any agent or developer picking this up.

---

## Production Status (as of 2026-04-24)

**Version:** v0.8.0  
**Branch:** `main` — up to date with `origin`  
**Repo:** `github.com/techstruction/1Place2Post`  
**URL:** `http://1place2post.techstruction.co`  
**Server:** Oracle Cloud Ubuntu 22.04 ARM64 (`openbrain-node-01` / `100.101.15.109` via Tailscale)

All phases 0–8 are complete and running in production.

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

## Key Architecture Decisions

See `LEDGER.md` for the full chronological record. Key decisions to know:

- **No Redis for MVP queue** — Postgres-backed `PublishJob` table with polling worker and exponential backoff. Redis/BullMQ planned for Phase 10.
- **Local disk uploads** — Multer saves to `/uploads/*` inside the API container. S3/R2 migration planned for Phase 10.
- **B2B team model** — All resources (posts, templates, assets) are scoped to a `Team`, not individual users.
- **Postgres DB user is `1p2p`** — not the default `postgres`.
- **Google OAuth via Passport.js** — `passwordHash` is nullable to support passwordless login paths.
- **ARM64 server** — all Docker images must be ARM64-compatible. Do not switch to alpine variants that lack ARM64 support.

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
  LEDGER.md   — Architectural decisions log
  ROADMAP.md  — Phase milestones
```

---

## What's Next

**Phase 9 — Testing Stage I** (immediate next focus):
- Scaffold test environment + seed DB accounts
- API validation for all endpoints
- E2E Playwright tests (`create-post.spec.ts`, visual regression)
- Specialized tests: RSS parsing, Bot Rules engine, Link-in-Bio routing
- Security: JWT scope fuzzing, OAuth integrity

**Phase 10 — Scale & Optimization:**
- Rate limiting (NestJS Throttler)
- S3/R2 storage migration (replace local disk)
- Redis/BullMQ job queue

**Phase 11 — AI Agents:**
- LLM-powered DM auto-replies (OpenAI/Anthropic)
- Sentiment analysis for inbox routing
- Smart scheduling suggestions

Full roadmap: `ROADMAP.md`

---

## Gotchas

- Postgres user is `1p2p`, not `postgres`
- ARM64 server — do not change Docker base images to alpine variants
- Port 7432 is the Command Center dashboard on the same server — don't use it for 1P2P test servers
- The `proxy` Docker network is external and shared; create it with `docker network create proxy` if it's missing
- `n8n_data/config` (56 bytes) is excluded from OneDrive backup — n8n regenerates it automatically
