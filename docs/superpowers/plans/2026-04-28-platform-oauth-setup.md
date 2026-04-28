# Platform OAuth Developer App Setup Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Context:** The OAuth *code* for all platforms (Facebook, Threads, YouTube, Telegram, TikTok, Instagram, Twitter) is already shipped in Phase 13b. What remains is creating developer accounts / apps on each platform, obtaining credentials, configuring production redirect URIs, and adding env vars to `apps/api/.env` on the server.
>
> **Server env file location:** `/home/ubuntu/1P2P-main/apps/api/.env`
>
> **Production redirect base URL:** `https://1place2post.techstruction.co/api`

**Goal:** Obtain OAuth credentials for Threads and TikTok (the two platforms without credentials), register production redirect URIs for all new platforms (Facebook, YouTube), and verify each connection end-to-end.

**Architecture:** All OAuth callbacks land at `https://1place2post.techstruction.co/api/social/<platform>/callback`. Facebook shares the same Meta developer app as Instagram. YouTube shares Google credentials. Threads requires a separate Meta product. TikTok requires a separate TikTok developer app. Telegram requires no credentials.

**Tech Stack:** Meta Developer Console, TikTok for Developers, Google Cloud Console

---

## Platform Credential Checklist

| Platform | Status | Credentials Needed | Notes |
|---|---|---|---|
| Instagram | ✅ Have credentials | None new | Shares Meta app; verify callback URI added |
| Facebook Pages | ⚠️ Add redirect URI | `FACEBOOK_REDIRECT_URI` | Same Meta app as Instagram |
| Threads | ❌ Need new credentials | `THREADS_CLIENT_ID`, `THREADS_CLIENT_SECRET`, `THREADS_REDIRECT_URI` | Separate product on same Meta app |
| YouTube | ⚠️ Add redirect URI | `YOUTUBE_REDIRECT_URI` | Same Google project as Google Login |
| Telegram | ✅ No credentials needed | None | Bot token provided by user per workspace |
| TikTok | ❌ Need new credentials | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI` | New TikTok developer app |
| Twitter/X | ✅ Have credentials | None new | Existing |

---

## Task 1: Facebook Pages — Add Redirect URI to Meta App

The Facebook Pages OAuth shares the Instagram Meta app. We just need to register the Facebook callback URI.

**Files:**
- Modify: `apps/api/.env` on production server

- [ ] **Step 1: Add Facebook redirect URI to Meta app**

1. Go to [developers.facebook.com](https://developers.facebook.com) → Your Apps → select the Instagram/1Place2Post app
2. Left sidebar → **Facebook Login** → **Settings**
3. Under "Valid OAuth Redirect URIs", add:
   ```
   https://1place2post.techstruction.co/api/social/facebook/callback
   ```
4. Save Changes

- [ ] **Step 2: Add env var to production .env**

SSH to `openbrain-node-01` and add to `apps/api/.env`:
```bash
FACEBOOK_REDIRECT_URI=https://1place2post.techstruction.co/api/social/facebook/callback
# FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET intentionally omitted — they fallback to INSTAGRAM_CLIENT_ID/SECRET
```

- [ ] **Step 3: Rebuild API container**

```bash
cd /home/ubuntu/1P2P-main
docker compose -f deploy/docker-compose.prod.yml up -d --build 1p_api_prod
docker exec 1p_nginx nginx -s reload
```

- [ ] **Step 4: Smoke test**

Navigate to `https://1place2post.techstruction.co/dashboard/connections`, click **+ Connect Account**, click **Facebook**, confirm it redirects to Facebook's permission dialog.

---

## Task 2: Threads — Register Meta App Product + Credentials

Threads uses a separate "Threads API" product within the same Meta developer app. You must apply for access.

**Files:**
- Modify: `apps/api/.env` on production server

- [ ] **Step 1: Add Threads API product to Meta app**

1. Go to [developers.facebook.com](https://developers.facebook.com) → Your Apps → select your app
2. Left sidebar → **Add Product** → find **Threads API** → click **Set Up**
3. This opens the Threads API dashboard within your existing Meta app
4. The App ID becomes your `THREADS_CLIENT_ID`

- [ ] **Step 2: Configure Threads OAuth redirect URI**

1. Within the Threads API product dashboard → **App Settings** → **Permissions & Features**
2. Under "OAuth Redirect URLs", add:
   ```
   https://1place2post.techstruction.co/api/social/threads/callback
   ```
3. Save

- [ ] **Step 3: Get Threads client credentials**

1. In the Threads API product → **App Settings** → note your **App ID** and **App Secret**
2. These are the same values as your Instagram/Facebook app — Threads uses the same Meta app credentials
3. If separate credentials are shown, note them; otherwise use `INSTAGRAM_CLIENT_ID` / `INSTAGRAM_CLIENT_SECRET` as fallback (the service already does this — check `THREADS_CLIENT_ID` fallback logic in `threads.service.ts` if needed)

> **Note:** Threads API requires approval for `threads_content_publish`. In development mode, only test users (added in the Roles panel) can authenticate. For production use, submit a Data Use Checkup and request publish permission via App Review.

- [ ] **Step 4: Add env vars to production .env**

```bash
THREADS_CLIENT_ID=<your_meta_app_id>
THREADS_CLIENT_SECRET=<your_meta_app_secret>
THREADS_REDIRECT_URI=https://1place2post.techstruction.co/api/social/threads/callback
```

- [ ] **Step 5: Rebuild and test**

```bash
docker compose -f deploy/docker-compose.prod.yml up -d --build 1p_api_prod
```

Test by clicking **Threads** in the PlatformGrid — should redirect to `https://threads.net/oauth/authorize`.

---

## Task 3: YouTube — Add Redirect URI to Google Cloud Console

YouTube OAuth reuses the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` already used for Google Login. We only need to add the YouTube callback URI.

**Files:**
- Modify: `apps/api/.env` on production server

- [ ] **Step 1: Add YouTube redirect URI to Google Cloud**

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → select your 1Place2Post project
2. **APIs & Services** → **Credentials** → click your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   ```
   https://1place2post.techstruction.co/api/social/youtube/callback
   ```
4. Save

- [ ] **Step 2: Enable YouTube Data API v3**

1. **APIs & Services** → **Library** → search "YouTube Data API v3"
2. If not enabled, click **Enable**

- [ ] **Step 3: Add env var**

```bash
YOUTUBE_REDIRECT_URI=https://1place2post.techstruction.co/api/social/youtube/callback
# GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET already present from Google Login
```

- [ ] **Step 4: Rebuild and test**

```bash
docker compose -f deploy/docker-compose.prod.yml up -d --build 1p_api_prod
```

Test by clicking **YouTube** in the PlatformGrid — should redirect to Google's OAuth consent screen requesting YouTube scopes.

---

## Task 4: TikTok — Create Developer App + Credentials

TikTok requires a separate developer account and app. Content Posting API access requires approval.

**Files:**
- Modify: `apps/api/.env` on production server

- [ ] **Step 1: Create TikTok developer account and app**

1. Go to [developers.tiktok.com](https://developers.tiktok.com) and log in with a TikTok account
2. **Manage Apps** → **Create App**
3. App name: `1Place2Post`, Category: `Social Media Management`, Description: brief product description
4. After creation, note the **Client Key** and **Client Secret** from the app dashboard

- [ ] **Step 2: Add Login Kit product**

1. In your app → **Products** → **Add Products** → **Login Kit** → **Configure**
2. Under "Redirect domain", add: `1place2post.techstruction.co`
3. Under "Redirect URIs", add:
   ```
   https://1place2post.techstruction.co/api/social/tiktok/callback
   ```
4. Save

- [ ] **Step 3: Add Content Posting API product**

1. **Products** → **Add Products** → **Content Posting API** → **Configure**
2. This allows `video.publish` and `video.upload` scopes
3. Note: This requires app review for production use. In sandbox mode, only registered test users can authenticate.

- [ ] **Step 4: Add env vars**

```bash
TIKTOK_CLIENT_KEY=<your_tiktok_client_key>
TIKTOK_CLIENT_SECRET=<your_tiktok_client_secret>
TIKTOK_REDIRECT_URI=https://1place2post.techstruction.co/api/social/tiktok/callback
```

- [ ] **Step 5: Rebuild and test**

```bash
docker compose -f deploy/docker-compose.prod.yml up -d --build 1p_api_prod
```

Test by clicking **TikTok** in the PlatformGrid — should redirect to `https://www.tiktok.com/v2/auth/authorize`.

---

## Task 5: Final Env Var Summary & Container Rebuild

- [ ] **Step 1: Verify all new env vars are in production .env**

```bash
grep -E "FACEBOOK_REDIRECT|THREADS_|YOUTUBE_REDIRECT|TIKTOK_" /home/ubuntu/1P2P-main/apps/api/.env
```

Expected output (all 7 vars):
```
FACEBOOK_REDIRECT_URI=https://1place2post.techstruction.co/api/social/facebook/callback
THREADS_CLIENT_ID=...
THREADS_CLIENT_SECRET=...
THREADS_REDIRECT_URI=https://1place2post.techstruction.co/api/social/threads/callback
YOUTUBE_REDIRECT_URI=https://1place2post.techstruction.co/api/social/youtube/callback
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
TIKTOK_REDIRECT_URI=https://1place2post.techstruction.co/api/social/tiktok/callback
```

- [ ] **Step 2: Final rebuild**

```bash
cd /home/ubuntu/1P2P-main
docker compose -f deploy/docker-compose.prod.yml up -d --build
docker exec 1p_nginx nginx -s reload
```

- [ ] **Step 3: End-to-end connection test for each platform**

For each implemented platform, from a logged-in browser session:
1. Navigate to `https://1place2post.techstruction.co/dashboard/connections`
2. Click **+ Connect Account**
3. Click the platform tile
4. Confirm OAuth redirect initiates (no 500 errors)
5. Complete auth in a test account
6. Confirm redirect back to `/dashboard/connections?success=<platform>_connected`
7. Confirm the connected account appears in the accounts table

---

## Self-Review Checklist

**Spec coverage:**
- [x] Facebook redirect URI registered (Task 1)
- [x] Threads credentials obtained + App Review note (Task 2)
- [x] YouTube redirect URI + API enabled (Task 3)
- [x] TikTok developer app + Content Posting API (Task 4)
- [x] All env vars documented in summary (Task 5)
- [x] Rebuild + smoke test steps for each (all tasks)

**Notes:**
- Threads `threads_content_publish` permission requires Meta App Review before non-test-users can connect. Factor 1–2 weeks for approval.
- TikTok Content Posting API also requires app review. In sandbox mode, add test TikTok accounts via the developer console.
- Telegram requires no credentials — users self-service via @BotFather.
- Instagram/Twitter credentials already exist and work.
- LinkedIn is "Coming Soon" in the UI — no credentials needed yet.
