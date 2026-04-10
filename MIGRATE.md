# MIGRATE.md — 1Place2Post: Old Server → New Server Migration

> Run this file as your Claude session context on the **OLD server**.
> Goal: locate all config, secrets, and database data, then transfer them to the new server.

---

## Context

The 1Place2Post app (https://github.com/techstruction/1Place2Post) is being migrated to a new server.
The new server already has the repo cloned at:
- `/home/ubuntu/1P2P-main` (main branch)
- `/home/ubuntu/1P2P-staging` (staging branch)

Your job on the old server is to find and transfer:
1. `.env.prod` and `.env.staging` files
2. PostgreSQL database dumps (prod + staging schemas)
3. Any uploaded media / persistent storage
4. Any other config files not in the repo

---

## Step 1 — Find the Repo and Env Files

```bash
# Locate the repo on this server
find / -name "docker-compose.prod.yml" -not -path "*/proc/*" 2>/dev/null
```

The compose files expect env files at the **repo root** (one level above `deploy/`):
- `<repo-root>/.env.prod`
- `<repo-root>/.env.staging`

Once found, confirm they exist:
```bash
ls -la <repo-root>/.env.prod <repo-root>/.env.staging
cat <repo-root>/.env.prod
cat <repo-root>/.env.staging
```

---

## Step 2 — Find the Running Containers

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}\t{{.Ports}}"
```

Look for containers named: `1p_api_prod`, `1p_web_prod`, `1p_api_st`, `1p_web_st`

If they are running, inspect each API container's env to capture any vars set at runtime (may differ from .env file):
```bash
docker inspect 1p_api_prod | jq '.[0].Config.Env'
docker inspect 1p_api_st   | jq '.[0].Config.Env'
```

---

## Step 3 — Find and Dump the PostgreSQL Database

### 3a. Locate PostgreSQL

```bash
# Is Postgres running as a container?
docker ps -a | grep -i postgres

# Is Postgres running on the host?
pg_isready 2>/dev/null || echo "not on host"
systemctl status postgresql 2>/dev/null | head -5
```

### 3b. Get the DATABASE_URL from the env file

The `DATABASE_URL` format is:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

Parse it out:
```bash
grep DATABASE_URL <repo-root>/.env.prod
grep DATABASE_URL <repo-root>/.env.staging
```

### 3c. Dump each database

**If Postgres is on the HOST:**
```bash
# Prod dump
pg_dump -U <USER> -d <DATABASE> -F c -f /tmp/1p2p_prod.dump

# Staging dump (may be same DB with different schema, or separate DB — check DATABASE_URL)
pg_dump -U <USER> -d <DATABASE_STAGING> -F c -f /tmp/1p2p_staging.dump
```

**If Postgres is in a DOCKER CONTAINER:**
```bash
# Find the container name
docker ps | grep postgres

# Dump from inside the container
docker exec <postgres_container> pg_dump -U <USER> -d <DATABASE> -F c > /tmp/1p2p_prod.dump
docker exec <postgres_container> pg_dump -U <USER> -d <DATABASE_STAGING> -F c > /tmp/1p2p_staging.dump
```

> Note: If prod and staging share one Postgres instance but different schemas or databases,
> dump them separately. Check the DATABASE_URL for each — the database name is the path segment.

---

## Step 4 — Find Any Uploaded Media or Persistent Storage

```bash
# Check for bind mounts or volumes on the API containers
docker inspect 1p_api_prod | jq '.[0].HostConfig.Binds'
docker inspect 1p_api_st   | jq '.[0].HostConfig.Binds'

# Check for an uploads or media directory in the repo
find <repo-root> -type d -name "uploads" -o -type d -name "media" -o -type d -name "public" 2>/dev/null | grep -v node_modules
```

If any bind-mounted directories contain user-uploaded files, note the path — they need to be transferred too.

---

## Step 5 — Transfer Everything to the New Server

New server IP / hostname: **[INSERT NEW SERVER IP HERE]**
New server SSH user: **ubuntu** (or confirm with owner)

### 5a. Transfer env files
```bash
scp <repo-root>/.env.prod  ubuntu@<NEW_SERVER_IP>:/home/ubuntu/1P2P-main/.env.prod
scp <repo-root>/.env.prod  ubuntu@<NEW_SERVER_IP>:/home/ubuntu/1P2P-staging/.env.prod
scp <repo-root>/.env.staging ubuntu@<NEW_SERVER_IP>:/home/ubuntu/1P2P-main/.env.staging
scp <repo-root>/.env.staging ubuntu@<NEW_SERVER_IP>:/home/ubuntu/1P2P-staging/.env.staging
```

### 5b. Transfer database dumps
```bash
scp /tmp/1p2p_prod.dump    ubuntu@<NEW_SERVER_IP>:/home/ubuntu/1p2p_prod.dump
scp /tmp/1p2p_staging.dump ubuntu@<NEW_SERVER_IP>:/home/ubuntu/1p2p_staging.dump
```

### 5c. Transfer any media/upload directories (if found in Step 4)
```bash
rsync -avz --progress <upload-dir>/ ubuntu@<NEW_SERVER_IP>:/home/ubuntu/1P2P-main/<upload-dir>/
```

---

## Step 6 — Verify Transfer Completeness

Before wrapping up, confirm you have captured:

- [ ] `.env.prod` — API keys, DB URL, JWT secret, OAuth credentials
- [ ] `.env.staging` — Same for staging environment
- [ ] `1p2p_prod.dump` — Full PostgreSQL dump of production database
- [ ] `1p2p_staging.dump` — Full PostgreSQL dump of staging database (if separate)
- [ ] Any uploaded media files transferred via rsync
- [ ] Any runtime env vars from `docker inspect` that weren't in the .env files

---

## What the New Server Will Do Next

Once files are transferred, on the new server:

1. **Spin up Postgres** (Docker container):
```bash
docker run -d \
  --name postgres \
  --restart unless-stopped \
  -e POSTGRES_USER=<USER> \
  -e POSTGRES_PASSWORD=<PASSWORD> \
  -e POSTGRES_DB=<DATABASE> \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16
```

2. **Restore the dumps**:
```bash
docker exec -i postgres pg_restore -U <USER> -d <DATABASE> < /home/ubuntu/1p2p_prod.dump
```

3. **Create the `proxy` Docker network**:
```bash
docker network create proxy
```

4. **Build and launch**:
```bash
cd /home/ubuntu/1P2P-main
docker compose -f deploy/docker-compose.prod.yml up -d --build
```

---

## Notes / Learnings

> Append findings here as you go. Example:
> - `[2026-04-10]` Postgres was running as a host service (not Docker) on port 5432, user=postgres, db=1p2p_prod
> - `[2026-04-10]` Staging used same Postgres instance, separate database named 1p2p_staging
> - `[2026-04-10]` Media uploads were bind-mounted at /var/www/1p2p/uploads
