# 1Place2Post — Test Commands Reference

A living document of all test and verification commands across the project. Run these locally or on staging to validate each phase.

---

## Unit Tests (Jest — API)

Run all unit tests:
```bash
cd apps/api
npx jest --no-coverage
```

Run tests for specific suites:
```bash
# Phase 1 — Auth + Posts
cd apps/api
npx jest --testPathPatterns="auth.service.spec|post.service.spec" --no-coverage

# Phase 2 — Link Pages + Bot Rules
cd apps/api
npx jest --testPathPatterns="link-page.service.spec|bot-rule.service.spec" --no-coverage

# Phase 3 — Analytics + Templates
cd apps/api
npx jest --testPathPatterns="analytics.service.spec|template.service.spec" --no-coverage

# All suites (Phases 1–3)
cd apps/api
npx jest --testPathPatterns="auth.service.spec|post.service.spec|link-page.service.spec|bot-rule.service.spec|analytics.service.spec|template.service.spec" --no-coverage
```

---

## Build Verification

```bash
# API
cd apps/api && npm run build

# Web
cd apps/web && npm run build
```

---

## Staging API Smoke Tests

All commands run inside the Docker container on the VPS. SSH in first:
```bash
ssh ubuntu-vm
```

### Install curl in container (Alpine, needed once per container restart)
```bash
docker exec 1p_api_st apk add --no-cache curl -q
```

### Health check
```bash
docker exec 1p_api_st curl -s http://localhost:35764/api/health
# Expected: {"status":"ok","env":"staging"}
```

### Auth — Register + Login
```bash
# Register
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123","name":"Test"}'
# Expected: {"access_token":"eyJ...","user":{...}}

# Store token for subsequent calls
TOKEN=$(docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
```

### Posts — CRUD
```bash
# Create post
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"caption":"Hello 1Place2Post!","hashtags":["#launch"],"scheduledAt":"2026-03-01T10:00:00Z"}'

# List posts
docker exec 1p_api_st curl -s http://localhost:35764/api/posts \
  -H "Authorization: Bearer $TOKEN"
```

### Social Accounts
```bash
# Add account (manual token)
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/social-accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"platform":"INSTAGRAM","platformId":"123456789","username":"@testaccount","accessToken":"fake-token-for-testing"}'

# List accounts
docker exec 1p_api_st curl -s http://localhost:35764/api/social-accounts \
  -H "Authorization: Bearer $TOKEN"
```

### Link-in-Bio
```bash
# Create link page
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/link-pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"slug":"my-links","title":"My Links","bio":"Check out my stuff"}'

# Add item
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/link-pages/$PAGE_ID/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"label":"My Website","url":"https://example.com"}'

# Publish page
docker exec 1p_api_st curl -s -X PATCH http://localhost:35764/api/link-pages/$PAGE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"published":true}'

# Visit public page (no auth)
docker exec 1p_api_st curl -s http://localhost:35764/api/l/my-links
```

### Bot Rules — Webhook Ingest
```bash
# Create a rule
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/bot-rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Pricing Reply","matchType":"CONTAINS","matchValue":"pricing","replyText":"Here are our prices: https://example.com/pricing","webhookUrl":"https://your-endpoint.com"}'

# Trigger ingest (replace SECRET and USER_ID)
curl -sS -X POST "https://1place2post-st.techstruction.co/api/webhooks/ingest" \
  -H "Content-Type: application/json" \
  -H "X-1P2P-Secret: <INCOMING_WEBHOOK_SECRET>" \
  -d '{"type":"inbox","userId":"<user-id>","platform":"instagram","data":{"fromHandle":"@lead","message":"what is your pricing?"}}'
# Expected: {"matched":true,"rule":"Pricing Reply"}
```

---

## Smoke Test Script (all Phase 1 endpoints)

Copy and run inside the API container:
```bash
docker cp scripts/smoke_test.sh 1p_api_st:/tmp/smoke_test.sh
docker exec 1p_api_st sh /tmp/smoke_test.sh
```

---

## Database Migrations

Apply a migration directly on staging (replace credentials as needed):
```bash
ssh ubuntu-vm
PGPASSWORD=change_me_in_prod psql \
  -h localhost -U app_1place2post -d db_1place2post_staging \
  -f ~/apps/1place2post/apps/api/prisma/migrations/<migration_folder>/migration.sql
```

---

## Staging Deployment Commands

```bash
# Sync source files to VPS
rsync -avzc --checksum apps/api/src/ ubuntu-vm:~/apps/1place2post/apps/api/src/
rsync -avzc --checksum apps/api/prisma/ ubuntu-vm:~/apps/1place2post/apps/api/prisma/
rsync -avzc --checksum apps/web/app/ ubuntu-vm:~/apps/1place2post/apps/web/app/
rsync -avzc --checksum apps/web/lib/ ubuntu-vm:~/apps/1place2post/apps/web/lib/
rsync -avzc --checksum apps/web/components/ ubuntu-vm:~/apps/1place2post/apps/web/components/
rsync -avzc --checksum apps/web/docs/ ubuntu-vm:~/apps/1place2post/apps/web/docs/
rsync -avzc --checksum apps/web/public/ ubuntu-vm:~/apps/1place2post/apps/web/public/

# Rebuild API image (no cache)
ssh ubuntu-vm "cd ~/apps/1place2post && docker compose -f deploy/docker-compose.staging.yml build --no-cache 1p_api_st"

# Restart API container
ssh ubuntu-vm "cd ~/apps/1place2post && docker rm -f 1p_api_st && docker compose -f deploy/docker-compose.staging.yml up -d 1p_api_st"

# Tail container logs
ssh ubuntu-vm "docker logs 1p_api_st --tail 20 -f"

# Check container health
ssh ubuntu-vm "docker ps --filter name=1p_api_st --format '{{.Names}} {{.Status}}'"
```

---

## Notes

- `INCOMING_WEBHOOK_SECRET` — set in `.env.staging` on VPS, check `apps/api/.env` for local value
- `DATABASE_URL` in `.env.staging` on VPS uses `172.27.0.1:5432` (Docker bridge gateway to host postgres)
- The `?schema=public` suffix in `DATABASE_URL` must be **stripped** when using `psql` directly
- Port `35764` = API inside Docker (from `.env.staging`); `35763` = default dev port

---

## Phase 3 — Media, Templates, Analytics, Teams

### Media Upload & Library
```bash
# Upload a file (from VPS host, via public staging URL)
curl -sS -X POST "https://1place2post-st.techstruction.co/api/media/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg"
# Expected: {"id":"...","urlPath":"/uploads/12345-image.jpg",...}

# List media assets
docker exec 1p_api_st curl -s http://localhost:35764/api/media \
  -H "Authorization: Bearer $TOKEN"

# Delete a media asset
docker exec 1p_api_st curl -s -X DELETE http://localhost:35764/api/media/$MEDIA_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Templates
```bash
# Create a template
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Product Launch","content":"Excited to share our new product!","hashtags":["#launch","#product"]}'

# Apply template (returns pre-filled post shape)
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/templates/$TMPL_ID/apply \
  -H "Authorization: Bearer $TOKEN"
# Expected: {"caption":"Excited to share...","hashtags":["#launch","#product"],"status":"DRAFT","templateId":"..."}
```

### Analytics Events
```bash
# Record an engagement event manually
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/analytics/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"platform":"INSTAGRAM","metric":"LIKES","value":150}'

# Get summary (totals + per-platform)
docker exec 1p_api_st curl -s http://localhost:35764/api/analytics/summary \
  -H "Authorization: Bearer $TOKEN"

# Get timeline (last 30 days, grouped by day)
docker exec 1p_api_st curl -s "http://localhost:35764/api/analytics/timeline?days=30" \
  -H "Authorization: Bearer $TOKEN"
```

### Teams
```bash
# Create a team
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/teams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"My Agency"}'

# Get my team
docker exec 1p_api_st curl -s http://localhost:35764/api/teams/mine \
  -H "Authorization: Bearer $TOKEN"

# Invite a member by email
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/teams/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"colleague@example.com"}'
```

---

## Phase 4 — Post Approvals, RSS Campaigns, Outgoing Webhooks, AI Studio

### Post Approvals
```bash
TOKEN=<your-token>
POST_ID=<post-id>

# Request approval (post must be DRAFT)
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/posts/$POST_ID/request-approval \
  -H "Authorization: Bearer $TOKEN"

# List pending approvals
docker exec 1p_api_st curl -s http://localhost:35764/api/approvals/pending \
  -H "Authorization: Bearer $TOKEN"

# Decide (approve or reject)
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/approvals/$APPROVAL_ID/decide \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"decision":"APPROVED","reason":"Looks great!"}'
```

### RSS Campaigns
```bash
# Create campaign
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/rss-campaigns \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Tech News","rssUrl":"https://feeds.feedburner.com/TechCrunch"}'

# List campaigns
docker exec 1p_api_st curl -s http://localhost:35764/api/rss-campaigns \
  -H "Authorization: Bearer $TOKEN"

# Toggle active state
docker exec 1p_api_st curl -s -X PATCH http://localhost:35764/api/rss-campaigns/$ID \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"isActive":false}'
```

### Outgoing Webhooks
```bash
# Register webhook
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/outgoing-webhooks \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"My Endpoint","url":"https://example.com/hook","events":["post.scheduled","post.approved"]}'

# List webhooks
docker exec 1p_api_st curl -s http://localhost:35764/api/outgoing-webhooks \
  -H "Authorization: Bearer $TOKEN"
```

### AI Caption Generation (Mock Mode)
```bash
# Generate caption (mock mode by default)
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/ai/generate-caption \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"topic":"our new fitness app launch","platform":"INSTAGRAM","tone":"casual"}'
# Expected: {"caption":"...","hashtags":["#...",...],"mode":"mock"}
```

---

## Phase 5 — Publish Queue, Notifications, Support

### Publish Queue
```bash
# Enqueue a scheduled post manually
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/jobs/publish/$POST_ID \
  -H "Authorization: Bearer $TOKEN"

# Cancel a pending/retry job
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/jobs/cancel/$POST_ID \
  -H "Authorization: Bearer $TOKEN"

# List jobs
docker exec 1p_api_st curl -s http://localhost:35764/api/jobs \
  -H "Authorization: Bearer $TOKEN"
```

### Notifications
```bash
# List notifications
docker exec 1p_api_st curl -s http://localhost:35764/api/notifications \
  -H "Authorization: Bearer $TOKEN"

# Mark one read
docker exec 1p_api_st curl -s -X PATCH http://localhost:35764/api/notifications/$NOTIF_ID/read \
  -H "Authorization: Bearer $TOKEN"

# Mark all read
docker exec 1p_api_st curl -s -X PATCH http://localhost:35764/api/notifications/read-all \
  -H "Authorization: Bearer $TOKEN"
```

### Support Tickets
```bash
# Create ticket
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/support/tickets \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"subject":"How to publish?","message":"I am having trouble scheduling my post."}'

# List tickets
docker exec 1p_api_st curl -s http://localhost:35764/api/support/tickets \
  -H "Authorization: Bearer $TOKEN"

# Get ticket thread
docker exec 1p_api_st curl -s http://localhost:35764/api/support/tickets/$TICKET_ID \
  -H "Authorization: Bearer $TOKEN"

# Add message to ticket
docker exec 1p_api_st curl -s -X POST http://localhost:35764/api/support/tickets/$TICKET_ID/messages \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"Nevermind, figured it out!"}'

# Close ticket
docker exec 1p_api_st curl -s -X PATCH http://localhost:35764/api/support/tickets/$TICKET_ID/close \
  -H "Authorization: Bearer $TOKEN"
```
