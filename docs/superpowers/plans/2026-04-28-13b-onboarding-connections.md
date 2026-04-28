# Onboarding Wizard & Platform Connections — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Prerequisite:** Plan 13a (Workspace Architecture) must be fully deployed before executing this plan. The Workspace model, WorkspaceRole, and THREADS/TELEGRAM Platform enum values are required.

**Goal:** Build a Publer-style onboarding wizard that guides new users through telling us about themselves → creating a workspace → connecting social accounts. Redesign the Connections page with a platform grid (all platforms shown, unimplemented ones marked "Coming Soon"). Add OAuth/connection services for Facebook Pages, Threads, YouTube, Telegram (bot token), and TikTok. Add a QuickStart video section on the dashboard.

**Architecture:**
- Onboarding lives at `/onboarding/` — no sidebar, clean full-screen wizard with a 4-step progress indicator. After completing Step 4 (or skipping), `onboardingCompletedAt` is saved on the User and the user is redirected to `/dashboard`.
- The platform grid is a reusable `PlatformGrid` component used in both the onboarding Step 3 and the redesigned Connections page.
- Each platform gets a modal or direct OAuth redirect. Unimplemented platforms show a "Coming Soon" card that is unclickable.
- Telegram uses a bot-token model (not OAuth) — the user creates a Telegram bot via @BotFather and pastes the token + their channel username.
- `POST /user/me` endpoint handles saving `onboardingCompletedAt` and `userRole` profile fields.

**Tech Stack:** Next.js 15 App Router (client components), NestJS (new platform service modules), Prisma, TypeScript

---

## File Map

**Created:**
- `apps/web/app/onboarding/layout.tsx` — clean wizard layout (no sidebar, progress indicator)
- `apps/web/app/onboarding/page.tsx` — redirects to step-1
- `apps/web/app/onboarding/step-1/page.tsx` — "Tell us about yourself" (role + referral)
- `apps/web/app/onboarding/step-2/page.tsx` — "Create your workspace" (name + industry)
- `apps/web/app/onboarding/step-3/page.tsx` — "Add social accounts" (platform grid)
- `apps/web/app/onboarding/step-4/page.tsx` — "You're all set!" (tour prompt + go to dashboard)
- `apps/web/components/PlatformGrid.tsx` — reusable platform picker grid
- `apps/web/components/platform-modals/InstagramModal.tsx`
- `apps/web/components/platform-modals/FacebookModal.tsx`
- `apps/web/components/platform-modals/TwitterModal.tsx`
- `apps/web/components/platform-modals/YoutubeModal.tsx`
- `apps/web/components/platform-modals/ThreadsModal.tsx`
- `apps/web/components/platform-modals/TelegramModal.tsx`
- `apps/web/components/platform-modals/TikTokModal.tsx`
- `apps/api/src/social/facebook/facebook.module.ts`
- `apps/api/src/social/facebook/facebook.controller.ts`
- `apps/api/src/social/facebook/facebook.service.ts`
- `apps/api/src/social/threads/threads.module.ts`
- `apps/api/src/social/threads/threads.controller.ts`
- `apps/api/src/social/threads/threads.service.ts`
- `apps/api/src/social/youtube/youtube.module.ts`
- `apps/api/src/social/youtube/youtube.controller.ts`
- `apps/api/src/social/youtube/youtube.service.ts`
- `apps/api/src/social/telegram/telegram.module.ts`
- `apps/api/src/social/telegram/telegram.controller.ts`
- `apps/api/src/social/telegram/telegram.service.ts`
- `apps/api/src/social/tiktok/tiktok.module.ts`
- `apps/api/src/social/tiktok/tiktok.controller.ts`
- `apps/api/src/social/tiktok/tiktok.service.ts`

**Modified:**
- `apps/api/src/app.module.ts` — import new platform modules
- `apps/api/src/user/user.service.ts` — add updateProfile method
- `apps/api/src/user/user.module.ts` — expose controller
- `apps/api/src/auth/auth.service.ts` — return `needsOnboarding` in token response
- `apps/web/app/register/page.tsx` — redirect to /onboarding/step-1 after register
- `apps/web/app/login/page.tsx` — redirect to /onboarding/step-1 if needsOnboarding
- `apps/web/app/dashboard/connections/page.tsx` — full rewrite with PlatformGrid
- `apps/web/app/dashboard/page.tsx` — add QuickStart video section
- `apps/web/lib/api.ts` — add userApi.updateProfile()

---

## Task 1: User Profile Endpoint — onboardingCompletedAt + userRole

**Files:**
- Modify: `apps/api/src/user/user.service.ts`
- Modify: `apps/api/src/user/user.module.ts`

- [ ] **Step 1: Add updateProfile to UserService**

Read `apps/api/src/user/user.service.ts`. Add the method (or replace the file if it only has a scaffold):

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, avatarUrl: true, role: true,
        userRole: true, onboardingCompletedAt: true, createdAt: true,
      },
    });
  }

  async updateProfile(userId: string, data: { name?: string; userRole?: string; onboardingCompletedAt?: Date | null }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.userRole !== undefined && { userRole: data.userRole as any }),
        ...(data.onboardingCompletedAt !== undefined && { onboardingCompletedAt: data.onboardingCompletedAt }),
      },
      select: {
        id: true, email: true, name: true, userRole: true, onboardingCompletedAt: true,
      },
    });
  }
}
```

- [ ] **Step 2: Expose PATCH /user/me in UserModule**

Read `apps/api/src/user/user.module.ts`. Ensure a controller is wired. If no controller exists, check if there's a user controller:

```bash
find /home/ubuntu/1P2P-main/apps/api/src/user -name "*.ts" | grep -v dist
```

If `user.controller.ts` doesn't exist, create it:

```typescript
import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsOptional, IsString, IsDateString } from 'class-validator';

class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() userRole?: string;
  @IsOptional() onboardingCompletedAt?: Date | null;
}

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@Req() req: any) {
    return this.userService.getMe(req.user.id);
  }

  @Patch('me')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }
}
```

And update `user.module.ts` to include the controller:

```typescript
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

- [ ] **Step 3: Update AuthService to return needsOnboarding**

In `apps/api/src/auth/auth.service.ts`, update `signToken` to include onboarding state. First update `register` and `login` to fetch the user's `onboardingCompletedAt`:

```typescript
async login(dto: LoginDto) {
  const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) throw new UnauthorizedException('Invalid credentials');
  if (!user.passwordHash) throw new UnauthorizedException('Please login with Google.');
  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) throw new UnauthorizedException('Invalid credentials');
  return this.signToken(user.id, user.email, user.role, user.onboardingCompletedAt);
}

async register(dto: RegisterDto) {
  const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw new ConflictException('Email already in use');
  const passwordHash = await bcrypt.hash(dto.password, 12);
  const user = await this.prisma.user.create({
    data: { email: dto.email, passwordHash, name: dto.name },
  });
  return this.signToken(user.id, user.email, user.role, user.onboardingCompletedAt);
}

private signToken(userId: string, email: string, role?: string, onboardingCompletedAt?: Date | null) {
  const payload = { sub: userId, email, role: role || 'USER' };
  return {
    access_token: this.jwt.sign(payload),
    needsOnboarding: !onboardingCompletedAt,
  };
}
```

- [ ] **Step 4: Add userApi helper to lib/api.ts**

```typescript
export const userApi = {
  me: () => authFetch('/user/me').then(r => r.json()),
  updateProfile: (data: { name?: string; userRole?: string; onboardingCompletedAt?: Date | null }) =>
    authFetch('/user/me', { method: 'PATCH', body: JSON.stringify(data) }).then(r => r.json()),
};
```

- [ ] **Step 5: Verify compile**

```bash
cd /home/ubuntu/1P2P-main/apps/api && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/api/src/user/ apps/api/src/auth/ apps/web/lib/api.ts && git commit -m "feat(user): PATCH /user/me endpoint for onboarding profile, needsOnboarding in auth response"
```

---

## Task 2: Facebook Pages OAuth Service

Facebook Pages uses the same Meta OAuth flow as Instagram (Facebook Login) but requests page management scopes. After auth, we fetch the user's Facebook Pages and store each page as a separate `SocialAccount` with `platform: FACEBOOK`.

**Files:**
- Create: `apps/api/src/social/facebook/facebook.service.ts`
- Create: `apps/api/src/social/facebook/facebook.controller.ts`
- Create: `apps/api/src/social/facebook/facebook.module.ts`

- [ ] **Step 1: Create FacebookService**

Create `apps/api/src/social/facebook/facebook.service.ts`:

```typescript
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Platform } from '@prisma/client';

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);
  private prisma = new PrismaClient();

  constructor(private configService: ConfigService) {}

  getAuthUrl(userId: string, workspaceId: string): string {
    const clientId = this.configService.get<string>('FACEBOOK_CLIENT_ID')
      || this.configService.get<string>('INSTAGRAM_CLIENT_ID');
    const redirectUri = this.configService.get<string>('FACEBOOK_REDIRECT_URI');
    if (!clientId || !redirectUri) throw new BadRequestException('Facebook OAuth not configured');

    const state = Buffer.from(JSON.stringify({ userId, workspaceId })).toString('base64');
    const scopes = [
      'pages_manage_posts', 'pages_read_engagement', 'pages_show_list',
      'pages_manage_metadata', 'read_insights',
    ].join(',');

    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scopes}&response_type=code`;
  }

  async handleCallback(code: string, state: string) {
    const { userId, workspaceId } = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));

    const clientId = this.configService.get<string>('FACEBOOK_CLIENT_ID')
      || this.configService.get<string>('INSTAGRAM_CLIENT_ID');
    const clientSecret = this.configService.get<string>('FACEBOOK_CLIENT_SECRET')
      || this.configService.get<string>('INSTAGRAM_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('FACEBOOK_REDIRECT_URI');

    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri!)}&client_secret=${clientSecret}&code=${code}`,
    );
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) throw new BadRequestException(tokenData.error?.message || 'Token exchange failed');

    const llRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${tokenData.access_token}`,
    );
    const llData = await llRes.json();
    const userToken = llData.access_token || tokenData.access_token;
    const userTokenExpiry = llData.expires_in ? new Date(Date.now() + llData.expires_in * 1000) : null;

    // Get managed Facebook Pages with page-level tokens
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${userToken}`,
    );
    const pagesData = await pagesRes.json();
    const pages = pagesData.data ?? [];

    if (pages.length === 0) {
      this.logger.warn(`User ${userId} has no managed Facebook Pages`);
      return { success: true, pagesConnected: 0 };
    }

    // Upsert each page as a separate SocialAccount
    for (const page of pages) {
      await this.prisma.socialAccount.upsert({
        where: {
          workspaceId_platform_platformId: {
            workspaceId,
            platform: Platform.FACEBOOK,
            platformId: page.id,
          },
        },
        update: {
          accessToken: page.access_token,
          tokenExpiry: userTokenExpiry,
          displayName: page.name,
          isActive: true,
          scopes: ['pages_manage_posts', 'pages_read_engagement'],
        },
        create: {
          userId,
          workspaceId,
          platform: Platform.FACEBOOK,
          platformId: page.id,
          displayName: page.name,
          accessToken: page.access_token,
          tokenExpiry: userTokenExpiry,
          isActive: true,
          scopes: ['pages_manage_posts', 'pages_read_engagement'],
          metaJson: JSON.stringify({ pageId: page.id }),
        },
      });
    }

    return { success: true, pagesConnected: pages.length };
  }
}
```

- [ ] **Step 2: Create FacebookController**

Create `apps/api/src/social/facebook/facebook.controller.ts`:

```typescript
import { Controller, Get, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import type { Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('social/facebook')
export class FacebookController {
  constructor(private readonly facebookService: FacebookService) {}

  @UseGuards(JwtAuthGuard)
  @Get('auth')
  connect(@Req() req: any, @Query('workspaceId') workspaceId: string, @Res() res: ExpressResponse) {
    if (!req.user?.id || !workspaceId) throw new UnauthorizedException('userId and workspaceId required');
    return res.redirect(this.facebookService.getAuthUrl(req.user.id, workspaceId));
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: ExpressResponse) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!code || !state) return res.redirect(`${frontendUrl}/dashboard/connections?error=facebook_auth_failed`);
    try {
      const result = await this.facebookService.handleCallback(code, state);
      return res.redirect(`${frontendUrl}/dashboard/connections?success=facebook_connected&pages=${result.pagesConnected}`);
    } catch {
      return res.redirect(`${frontendUrl}/dashboard/connections?error=facebook_auth_failed`);
    }
  }
}
```

- [ ] **Step 3: Create FacebookModule**

Create `apps/api/src/social/facebook/facebook.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { FacebookController } from './facebook.controller';
import { FacebookService } from './facebook.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [FacebookController],
  providers: [FacebookService],
})
export class FacebookModule {}
```

- [ ] **Step 4: Add env vars to .env**

Add to `apps/api/.env` (if FACEBOOK_CLIENT_ID differs from INSTAGRAM_CLIENT_ID — they may share the same Meta App):

```
FACEBOOK_REDIRECT_URI=http://localhost:35763/api/social/facebook/callback
# FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET can be same as INSTAGRAM if using one Meta App
```

- [ ] **Step 5: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/api/src/social/facebook/ && git commit -m "feat(facebook): Facebook Pages OAuth service — multi-page upsert on callback"
```

---

## Task 3: Threads OAuth Service

Threads uses Meta's Threads API OAuth — separate app credentials from Instagram, different scopes, but same OAuth 2.0 flow pattern.

**Files:**
- Create: `apps/api/src/social/threads/threads.service.ts`
- Create: `apps/api/src/social/threads/threads.controller.ts`
- Create: `apps/api/src/social/threads/threads.module.ts`

- [ ] **Step 1: Create ThreadsService**

Create `apps/api/src/social/threads/threads.service.ts`:

```typescript
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Platform } from '@prisma/client';

@Injectable()
export class ThreadsService {
  private readonly logger = new Logger(ThreadsService.name);
  private prisma = new PrismaClient();

  constructor(private configService: ConfigService) {}

  getAuthUrl(userId: string, workspaceId: string): string {
    const clientId = this.configService.get<string>('THREADS_CLIENT_ID');
    const redirectUri = this.configService.get<string>('THREADS_REDIRECT_URI');
    if (!clientId || !redirectUri) throw new BadRequestException('Threads OAuth credentials not configured');

    const state = Buffer.from(JSON.stringify({ userId, workspaceId })).toString('base64');
    const scopes = ['threads_basic', 'threads_content_publish'].join(',');

    return `https://threads.net/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${state}`;
  }

  async handleCallback(code: string, state: string) {
    const { userId, workspaceId } = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));

    const clientId = this.configService.get<string>('THREADS_CLIENT_ID');
    const clientSecret = this.configService.get<string>('THREADS_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('THREADS_REDIRECT_URI');

    // Exchange code for short-lived token
    const tokenRes = await fetch('https://graph.threads.net/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!, client_secret: clientSecret!,
        grant_type: 'authorization_code', redirect_uri: redirectUri!, code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) throw new BadRequestException(tokenData.error_message || 'Token exchange failed');

    // Exchange for long-lived token (60-day)
    const llRes = await fetch(
      `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${clientSecret}&access_token=${tokenData.access_token}`,
    );
    const llData = await llRes.json();
    const accessToken = llData.access_token || tokenData.access_token;
    const tokenExpiry = llData.expires_in ? new Date(Date.now() + llData.expires_in * 1000) : null;

    // Get user profile
    const meRes = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username,name&access_token=${accessToken}`,
    );
    const meData = await meRes.json();

    await this.prisma.socialAccount.upsert({
      where: {
        workspaceId_platform_platformId: { workspaceId, platform: Platform.THREADS, platformId: meData.id },
      },
      update: { accessToken, tokenExpiry, displayName: meData.name, username: meData.username, isActive: true },
      create: {
        userId, workspaceId, platform: Platform.THREADS, platformId: meData.id,
        username: meData.username, displayName: meData.name,
        accessToken, tokenExpiry, isActive: true,
        scopes: ['threads_basic', 'threads_content_publish'], metaJson: '{}',
      },
    });

    return { success: true, platformId: meData.id };
  }
}
```

- [ ] **Step 2: Create ThreadsController**

Create `apps/api/src/social/threads/threads.controller.ts`:

```typescript
import { Controller, Get, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ThreadsService } from './threads.service';
import type { Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('social/threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('auth')
  connect(@Req() req: any, @Query('workspaceId') workspaceId: string, @Res() res: ExpressResponse) {
    if (!req.user?.id || !workspaceId) throw new UnauthorizedException();
    return res.redirect(this.threadsService.getAuthUrl(req.user.id, workspaceId));
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: ExpressResponse) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!code || !state) return res.redirect(`${frontendUrl}/dashboard/connections?error=threads_auth_failed`);
    try {
      await this.threadsService.handleCallback(code, state);
      return res.redirect(`${frontendUrl}/dashboard/connections?success=threads_connected`);
    } catch {
      return res.redirect(`${frontendUrl}/dashboard/connections?error=threads_auth_failed`);
    }
  }
}
```

- [ ] **Step 3: Create ThreadsModule**

Create `apps/api/src/social/threads/threads.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ThreadsController } from './threads.controller';
import { ThreadsService } from './threads.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [ThreadsController],
  providers: [ThreadsService],
})
export class ThreadsModule {}
```

- [ ] **Step 4: Add env vars**

```
THREADS_CLIENT_ID=your_threads_app_id
THREADS_CLIENT_SECRET=your_threads_app_secret
THREADS_REDIRECT_URI=http://localhost:35763/api/social/threads/callback
```

- [ ] **Step 5: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/api/src/social/threads/ && git commit -m "feat(threads): Threads OAuth service via Meta Threads API"
```

---

## Task 4: YouTube OAuth Service

YouTube uses Google OAuth 2.0. We already have `google.strategy.ts` for login auth — YouTube uses the same Google account but different scopes (YouTube Data API v3 for uploads).

**Files:**
- Create: `apps/api/src/social/youtube/youtube.service.ts`
- Create: `apps/api/src/social/youtube/youtube.controller.ts`
- Create: `apps/api/src/social/youtube/youtube.module.ts`

- [ ] **Step 1: Create YouTubeService**

Create `apps/api/src/social/youtube/youtube.service.ts`:

```typescript
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Platform } from '@prisma/client';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private prisma = new PrismaClient();

  constructor(private configService: ConfigService) {}

  getAuthUrl(userId: string, workspaceId: string): string {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('YOUTUBE_REDIRECT_URI');
    if (!clientId || !redirectUri) throw new BadRequestException('YouTube OAuth not configured');

    const state = Buffer.from(JSON.stringify({ userId, workspaceId })).toString('base64');
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId, redirect_uri: redirectUri,
      response_type: 'code', scope: scopes, state,
      access_type: 'offline', prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async handleCallback(code: string, state: string) {
    const { userId, workspaceId } = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));

    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('YOUTUBE_REDIRECT_URI');

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: clientId!, client_secret: clientSecret!,
        redirect_uri: redirectUri!, grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) throw new BadRequestException(tokenData.error || 'Token exchange failed');

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const tokenExpiry = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null;

    // Get YouTube channel info
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&access_token=${accessToken}`,
    );
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];
    if (!channel) throw new BadRequestException('No YouTube channel found for this Google account');

    await this.prisma.socialAccount.upsert({
      where: {
        workspaceId_platform_platformId: { workspaceId, platform: Platform.YOUTUBE, platformId: channel.id },
      },
      update: { accessToken, refreshToken, tokenExpiry, displayName: channel.snippet?.title, isActive: true },
      create: {
        userId, workspaceId, platform: Platform.YOUTUBE, platformId: channel.id,
        displayName: channel.snippet?.title,
        username: channel.snippet?.customUrl ?? channel.id,
        accessToken, refreshToken, tokenExpiry, isActive: true,
        scopes: ['youtube.upload', 'youtube.readonly'], metaJson: '{}',
      },
    });

    return { success: true, channelId: channel.id };
  }
}
```

- [ ] **Step 2: Create YoutubeController**

Create `apps/api/src/social/youtube/youtube.controller.ts`:

```typescript
import { Controller, Get, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { YoutubeService } from './youtube.service';
import type { Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('social/youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @UseGuards(JwtAuthGuard)
  @Get('auth')
  connect(@Req() req: any, @Query('workspaceId') workspaceId: string, @Res() res: ExpressResponse) {
    if (!req.user?.id || !workspaceId) throw new UnauthorizedException();
    return res.redirect(this.youtubeService.getAuthUrl(req.user.id, workspaceId));
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: ExpressResponse) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!code || !state) return res.redirect(`${frontendUrl}/dashboard/connections?error=youtube_auth_failed`);
    try {
      await this.youtubeService.handleCallback(code, state);
      return res.redirect(`${frontendUrl}/dashboard/connections?success=youtube_connected`);
    } catch {
      return res.redirect(`${frontendUrl}/dashboard/connections?error=youtube_auth_failed`);
    }
  }
}
```

- [ ] **Step 3: Create YoutubeModule**

Create `apps/api/src/social/youtube/youtube.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { YoutubeController } from './youtube.controller';
import { YoutubeService } from './youtube.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [YoutubeController],
  providers: [YoutubeService],
})
export class YoutubeModule {}
```

- [ ] **Step 4: Add env vars**

```
YOUTUBE_REDIRECT_URI=http://localhost:35763/api/social/youtube/callback
# GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET already exist from Google login strategy
```

- [ ] **Step 5: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/api/src/social/youtube/ && git commit -m "feat(youtube): YouTube channel OAuth via Google OAuth2 with refresh token"
```

---

## Task 5: Telegram Bot Token Service

Telegram does not use OAuth. Users create a bot via @BotFather, add it as admin to their channel, and paste the bot token. We verify by calling `getChat` on the channel.

**Files:**
- Create: `apps/api/src/social/telegram/telegram.service.ts`
- Create: `apps/api/src/social/telegram/telegram.controller.ts`
- Create: `apps/api/src/social/telegram/telegram.module.ts`

- [ ] **Step 1: Create TelegramService**

Create `apps/api/src/social/telegram/telegram.service.ts`:

```typescript
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient, Platform } from '@prisma/client';

export interface ConnectTelegramDto {
  botToken: string;
  channelUsername: string;
  workspaceId: string;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private prisma = new PrismaClient();

  async connectChannel(userId: string, dto: ConnectTelegramDto) {
    const { botToken, channelUsername, workspaceId } = dto;

    // Normalise username (ensure @ prefix for channel lookup)
    const target = channelUsername.startsWith('@') ? channelUsername : `@${channelUsername}`;

    // Verify bot has access to channel
    const chatRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${target}`);
    const chatData = await chatRes.json();
    if (!chatData.ok) {
      throw new BadRequestException(
        `Could not access Telegram channel. Make sure the bot is an admin of ${target}. Error: ${chatData.description}`,
      );
    }

    const chat = chatData.result;
    const channelId = String(chat.id);
    const channelTitle = chat.title ?? chat.username ?? channelUsername;
    const channelHandle = chat.username ?? channelUsername.replace('@', '');

    await this.prisma.socialAccount.upsert({
      where: {
        workspaceId_platform_platformId: { workspaceId, platform: Platform.TELEGRAM, platformId: channelId },
      },
      update: { accessToken: botToken, displayName: channelTitle, username: channelHandle, isActive: true },
      create: {
        userId, workspaceId, platform: Platform.TELEGRAM, platformId: channelId,
        displayName: channelTitle, username: channelHandle,
        accessToken: botToken,
        isActive: true, scopes: ['bot'], metaJson: JSON.stringify({ channelId }),
      },
    });

    return { success: true, channelId, channelTitle };
  }
}
```

- [ ] **Step 2: Create TelegramController**

Create `apps/api/src/social/telegram/telegram.controller.ts`:

```typescript
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { TelegramService, ConnectTelegramDto } from './telegram.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IsString } from 'class-validator';

class ConnectTelegramBody {
  @IsString() botToken: string;
  @IsString() channelUsername: string;
  @IsString() workspaceId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('social/telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('connect')
  connect(@Req() req: any, @Body() body: ConnectTelegramBody) {
    return this.telegramService.connectChannel(req.user.id, body);
  }
}
```

- [ ] **Step 3: Create TelegramModule**

Create `apps/api/src/social/telegram/telegram.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

@Module({
  controllers: [TelegramController],
  providers: [TelegramService],
})
export class TelegramModule {}
```

- [ ] **Step 4: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/api/src/social/telegram/ && git commit -m "feat(telegram): Telegram bot-token channel connection with getChat verification"
```

---

## Task 6: TikTok OAuth Service

TikTok uses OAuth 2.0 with PKCE for the Login Kit / Content Posting API.

**Files:**
- Create: `apps/api/src/social/tiktok/tiktok.service.ts`
- Create: `apps/api/src/social/tiktok/tiktok.controller.ts`
- Create: `apps/api/src/social/tiktok/tiktok.module.ts`

- [ ] **Step 1: Create TikTokService**

Create `apps/api/src/social/tiktok/tiktok.service.ts`:

```typescript
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Platform } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class TiktokService {
  private readonly logger = new Logger(TiktokService.name);
  private prisma = new PrismaClient();
  private tempStore = new Map<string, { codeVerifier: string; userId: string; workspaceId: string }>();

  constructor(private configService: ConfigService) {}

  getAuthUrl(userId: string, workspaceId: string): string {
    const clientKey = this.configService.get<string>('TIKTOK_CLIENT_KEY');
    const redirectUri = this.configService.get<string>('TIKTOK_REDIRECT_URI');
    if (!clientKey || !redirectUri) throw new BadRequestException('TikTok OAuth not configured');

    // PKCE
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
    const state = randomBytes(16).toString('hex');
    this.tempStore.set(state, { codeVerifier, userId, workspaceId });
    setTimeout(() => this.tempStore.delete(state), 10 * 60 * 1000);

    const scopes = ['user.info.basic', 'video.publish', 'video.upload'].join(',');
    const params = new URLSearchParams({
      client_key: clientKey, redirect_uri: redirectUri,
      scope: scopes, response_type: 'code', state,
      code_challenge: codeChallenge, code_challenge_method: 'S256',
    });

    return `https://www.tiktok.com/v2/auth/authorize?${params}`;
  }

  async handleCallback(code: string, state: string) {
    const stored = this.tempStore.get(state);
    if (!stored) throw new BadRequestException('Invalid or expired state');
    const { codeVerifier, userId, workspaceId } = stored;
    this.tempStore.delete(state);

    const clientKey = this.configService.get<string>('TIKTOK_CLIENT_KEY');
    const clientSecret = this.configService.get<string>('TIKTOK_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('TIKTOK_REDIRECT_URI');

    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey!, client_secret: clientSecret!,
        code, grant_type: 'authorization_code',
        redirect_uri: redirectUri!, code_verifier: codeVerifier,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) throw new BadRequestException(tokenData.error || 'Token exchange failed');

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const tokenExpiry = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null;
    const openId = tokenData.open_id;

    // Get user info
    const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userData = await userRes.json();
    const userInfo = userData.data?.user ?? {};

    await this.prisma.socialAccount.upsert({
      where: {
        workspaceId_platform_platformId: { workspaceId, platform: Platform.TIKTOK, platformId: openId },
      },
      update: { accessToken, refreshToken, tokenExpiry, displayName: userInfo.display_name, username: userInfo.username, isActive: true },
      create: {
        userId, workspaceId, platform: Platform.TIKTOK, platformId: openId,
        displayName: userInfo.display_name, username: userInfo.username,
        accessToken, refreshToken, tokenExpiry, isActive: true,
        scopes: ['user.info.basic', 'video.publish', 'video.upload'], metaJson: '{}',
      },
    });

    return { success: true, platformId: openId };
  }
}
```

- [ ] **Step 2: Create TiktokController**

Create `apps/api/src/social/tiktok/tiktok.controller.ts`:

```typescript
import { Controller, Get, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { TiktokService } from './tiktok.service';
import type { Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('social/tiktok')
export class TiktokController {
  constructor(private readonly tiktokService: TiktokService) {}

  @UseGuards(JwtAuthGuard)
  @Get('auth')
  connect(@Req() req: any, @Query('workspaceId') workspaceId: string, @Res() res: ExpressResponse) {
    if (!req.user?.id || !workspaceId) throw new UnauthorizedException();
    return res.redirect(this.tiktokService.getAuthUrl(req.user.id, workspaceId));
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: ExpressResponse) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!code || !state) return res.redirect(`${frontendUrl}/dashboard/connections?error=tiktok_auth_failed`);
    try {
      await this.tiktokService.handleCallback(code, state);
      return res.redirect(`${frontendUrl}/dashboard/connections?success=tiktok_connected`);
    } catch {
      return res.redirect(`${frontendUrl}/dashboard/connections?error=tiktok_auth_failed`);
    }
  }
}
```

- [ ] **Step 3: Create TiktokModule**

Create `apps/api/src/social/tiktok/tiktok.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TiktokController } from './tiktok.controller';
import { TiktokService } from './tiktok.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [TiktokController],
  providers: [TiktokService],
})
export class TiktokModule {}
```

- [ ] **Step 4: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/api/src/social/tiktok/ && git commit -m "feat(tiktok): TikTok OAuth 2.0 PKCE service for video.publish scope"
```

---

## Task 7: Wire New Platform Modules into AppModule

**Files:**
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Add imports to app.module.ts**

Add to the import statements:

```typescript
import { FacebookModule } from './social/facebook/facebook.module';
import { ThreadsModule } from './social/threads/threads.module';
import { YoutubeModule } from './social/youtube/youtube.module';
import { TelegramModule } from './social/telegram/telegram.module';
import { TiktokModule } from './social/tiktok/tiktok.module';
```

Add to the `imports` array:

```typescript
FacebookModule,
ThreadsModule,
YoutubeModule,
TelegramModule,
TiktokModule,
```

- [ ] **Step 2: Compile check**

```bash
cd /home/ubuntu/1P2P-main/apps/api && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/api/src/app.module.ts && git commit -m "chore(api): register Facebook, Threads, YouTube, Telegram, TikTok modules"
```

---

## Task 8: PlatformGrid Component

This is the reusable grid of all platforms, shown in Onboarding Step 3 and the Connections page. Implemented platforms get an OAuth button; unimplemented ones show a "Coming Soon" overlay.

**Files:**
- Create: `apps/web/components/PlatformGrid.tsx`

- [ ] **Step 1: Create PlatformGrid**

Create `apps/web/components/PlatformGrid.tsx`:

```typescript
'use client';
import { useState } from 'react';
import InstagramModal from './platform-modals/InstagramModal';
import FacebookModal from './platform-modals/FacebookModal';
import TwitterModal from './platform-modals/TwitterModal';
import YoutubeModal from './platform-modals/YoutubeModal';
import ThreadsModal from './platform-modals/ThreadsModal';
import TelegramModal from './platform-modals/TelegramModal';
import TikTokModal from './platform-modals/TikTokModal';

export type PlatformDef = {
  id: string;
  label: string;
  icon: string;         // emoji or SVG string
  color: string;        // brand color for icon bg
  implemented: boolean;
};

const PLATFORMS: PlatformDef[] = [
  { id: 'INSTAGRAM',  label: 'Instagram',   icon: '📸', color: '#E1306C', implemented: true },
  { id: 'FACEBOOK',   label: 'Facebook',    icon: '👥', color: '#1877F2', implemented: true },
  { id: 'TWITTER',    label: 'Twitter / X', icon: '✕',  color: '#000000', implemented: true },
  { id: 'YOUTUBE',    label: 'YouTube',     icon: '▶', color: '#FF0000', implemented: true },
  { id: 'THREADS',    label: 'Threads',     icon: '@',  color: '#000000', implemented: true },
  { id: 'TELEGRAM',   label: 'Telegram',    icon: '✈',  color: '#2CA5E0', implemented: true },
  { id: 'TIKTOK',     label: 'TikTok',      icon: '♪',  color: '#010101', implemented: true },
  { id: 'LINKEDIN',   label: 'LinkedIn',    icon: 'in', color: '#0A66C2', implemented: false },
  { id: 'PINTEREST',  label: 'Pinterest',   icon: '𝙿',  color: '#E60023', implemented: false },
  { id: 'BLUESKY',    label: 'Bluesky',     icon: '🦋', color: '#0085FF', implemented: false },
  { id: 'MASTODON',   label: 'Mastodon',    icon: '🐘', color: '#6364FF', implemented: false },
  { id: 'SNAPCHAT',   label: 'Snapchat',    icon: '👻', color: '#FFFC00', implemented: false },
];

type Props = {
  workspaceId: string;
  onConnected?: (platform: string) => void;
};

export default function PlatformGrid({ workspaceId, onConnected }: Props) {
  const [openModal, setOpenModal] = useState<string | null>(null);

  function handleClick(platform: PlatformDef) {
    if (!platform.implemented) return;
    setOpenModal(platform.id);
  }

  function handleClose(connected?: boolean) {
    if (connected && openModal) onConnected?.(openModal);
    setOpenModal(null);
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '1rem',
      }}>
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => handleClick(p)}
            disabled={!p.implemented}
            style={{
              position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '0.75rem', padding: '1.5rem 1rem',
              border: '1.5px solid var(--border-default)', borderRadius: 12,
              background: 'var(--bg-card)', cursor: p.implemented ? 'pointer' : 'default',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              opacity: p.implemented ? 1 : 0.5,
            }}
            onMouseEnter={e => { if (p.implemented) (e.currentTarget as HTMLElement).style.borderColor = p.color; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
          >
            {/* Platform icon */}
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {p.icon}
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.label}</span>
            {!p.implemented && (
              <span style={{
                position: 'absolute', top: 8, right: 8,
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em',
                background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                borderRadius: 4, padding: '2px 5px', color: 'var(--text-muted)',
              }}>
                SOON
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Modals */}
      {openModal === 'INSTAGRAM' && <InstagramModal workspaceId={workspaceId} onClose={handleClose} />}
      {openModal === 'FACEBOOK'  && <FacebookModal  workspaceId={workspaceId} onClose={handleClose} />}
      {openModal === 'TWITTER'   && <TwitterModal   workspaceId={workspaceId} onClose={handleClose} />}
      {openModal === 'YOUTUBE'   && <YoutubeModal   workspaceId={workspaceId} onClose={handleClose} />}
      {openModal === 'THREADS'   && <ThreadsModal   workspaceId={workspaceId} onClose={handleClose} />}
      {openModal === 'TELEGRAM'  && <TelegramModal  workspaceId={workspaceId} onClose={handleClose} />}
      {openModal === 'TIKTOK'    && <TikTokModal    workspaceId={workspaceId} onClose={handleClose} />}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/components/PlatformGrid.tsx && git commit -m "feat(web): PlatformGrid component with Coming Soon indicators"
```

---

## Task 9: Platform Connection Modals

Each modal explains the connection requirements and initiates the OAuth redirect or API call. All modals follow the same visual shell.

**Files:**
- Create: `apps/web/components/platform-modals/InstagramModal.tsx`
- Create: `apps/web/components/platform-modals/FacebookModal.tsx`
- Create: `apps/web/components/platform-modals/TwitterModal.tsx`
- Create: `apps/web/components/platform-modals/YoutubeModal.tsx`
- Create: `apps/web/components/platform-modals/ThreadsModal.tsx`
- Create: `apps/web/components/platform-modals/TelegramModal.tsx`
- Create: `apps/web/components/platform-modals/TikTokModal.tsx`

- [ ] **Step 1: Create the modal shell component inline pattern**

All modals share this structure. Create each file as follows. Start with InstagramModal — it demonstrates the OAuth-redirect pattern:

Create `apps/web/components/platform-modals/InstagramModal.tsx`:

```typescript
'use client';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';

type Props = { workspaceId: string; onClose: (connected?: boolean) => void };

export default function InstagramModal({ workspaceId, onClose }: Props) {
  function connectViaFacebook() {
    const token = localStorage.getItem('1p2p_token');
    window.location.href = `${API}/social/instagram/auth?token=${token}&workspaceId=${workspaceId}`;
  }

  return (
    <ModalShell title="Connect Instagram" onClose={onClose}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
        Instagram requires a <strong>Professional account</strong> (Business or Creator) linked to a Facebook Page.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
        <button className="btn btn-primary" style={{ background: '#1877F2' }} onClick={connectViaFacebook}>
          🔗 Connect via Facebook (Professional)
        </button>
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '1rem' }}>
        Make sure your Instagram account is linked to a Facebook Page before connecting. Personal accounts are not supported.
      </p>
    </ModalShell>
  );
}

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card" style={{ width: 420, maxWidth: '90vw', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h2>
          <button onClick={() => onClose()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

Create `apps/web/components/platform-modals/FacebookModal.tsx`:

```typescript
'use client';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
type Props = { workspaceId: string; onClose: (connected?: boolean) => void };
export default function FacebookModal({ workspaceId, onClose }: Props) {
  function connect() {
    const token = localStorage.getItem('1p2p_token');
    window.location.href = `${API}/social/facebook/auth?token=${token}&workspaceId=${workspaceId}`;
  }
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center' }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="card" style={{ width:420,maxWidth:'90vw',padding:'1.5rem' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem' }}>
          <h2 style={{ fontSize:'1rem',fontWeight:700 }}>Connect Facebook Page</h2>
          <button onClick={()=>onClose()} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'1.2rem' }}>✕</button>
        </div>
        <p style={{ color:'var(--text-muted)',fontSize:'0.875rem',marginBottom:'1rem' }}>
          Connect a Facebook Page you manage. You will be prompted to select which pages to grant access to.
        </p>
        <button className="btn btn-primary" style={{ background:'#1877F2',width:'100%' }} onClick={connect}>
          🔗 Connect via Facebook
        </button>
      </div>
    </div>
  );
}
```

Create `apps/web/components/platform-modals/TwitterModal.tsx`:

```typescript
'use client';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
type Props = { workspaceId: string; onClose: (connected?: boolean) => void };
export default function TwitterModal({ workspaceId, onClose }: Props) {
  function connect() {
    const token = localStorage.getItem('1p2p_token');
    window.location.href = `${API}/social/twitter/auth?token=${token}&workspaceId=${workspaceId}`;
  }
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center' }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="card" style={{ width:420,maxWidth:'90vw',padding:'1.5rem' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem' }}>
          <h2 style={{ fontSize:'1rem',fontWeight:700 }}>Connect Twitter / X</h2>
          <button onClick={()=>onClose()} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'1.2rem' }}>✕</button>
        </div>
        <p style={{ color:'var(--text-muted)',fontSize:'0.875rem',marginBottom:'1rem' }}>
          Connect your Twitter/X account to post tweets and threads.
        </p>
        <button className="btn btn-primary" style={{ background:'#000',width:'100%' }} onClick={connect}>
          ✕ Connect Twitter / X
        </button>
      </div>
    </div>
  );
}
```

Create `apps/web/components/platform-modals/YoutubeModal.tsx`:

```typescript
'use client';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
type Props = { workspaceId: string; onClose: (connected?: boolean) => void };
export default function YoutubeModal({ workspaceId, onClose }: Props) {
  function connect() {
    const token = localStorage.getItem('1p2p_token');
    window.location.href = `${API}/social/youtube/auth?token=${token}&workspaceId=${workspaceId}`;
  }
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center' }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="card" style={{ width:420,maxWidth:'90vw',padding:'1.5rem' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem' }}>
          <h2 style={{ fontSize:'1rem',fontWeight:700 }}>Connect YouTube Channel</h2>
          <button onClick={()=>onClose()} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'1.2rem' }}>✕</button>
        </div>
        <p style={{ color:'var(--text-muted)',fontSize:'0.875rem',marginBottom:'1rem' }}>
          Connect your YouTube channel to schedule and publish video content.
        </p>
        <button className="btn btn-primary" style={{ background:'#FF0000',width:'100%' }} onClick={connect}>
          ▶ Connect YouTube via Google
        </button>
      </div>
    </div>
  );
}
```

Create `apps/web/components/platform-modals/ThreadsModal.tsx`:

```typescript
'use client';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
type Props = { workspaceId: string; onClose: (connected?: boolean) => void };
export default function ThreadsModal({ workspaceId, onClose }: Props) {
  function connect() {
    const token = localStorage.getItem('1p2p_token');
    window.location.href = `${API}/social/threads/auth?token=${token}&workspaceId=${workspaceId}`;
  }
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center' }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="card" style={{ width:420,maxWidth:'90vw',padding:'1.5rem' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem' }}>
          <h2 style={{ fontSize:'1rem',fontWeight:700 }}>Connect Threads</h2>
          <button onClick={()=>onClose()} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'1.2rem' }}>✕</button>
        </div>
        <p style={{ color:'var(--text-muted)',fontSize:'0.875rem',marginBottom:'1rem' }}>
          Requires a Threads account linked to your Instagram Professional account.
        </p>
        <button className="btn btn-primary" style={{ background:'#000',width:'100%' }} onClick={connect}>
          @ Connect Threads
        </button>
      </div>
    </div>
  );
}
```

Create `apps/web/components/platform-modals/TelegramModal.tsx` — this is different (bot token form):

```typescript
'use client';
import { useState } from 'react';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
type Props = { workspaceId: string; onClose: (connected?: boolean) => void };
export default function TelegramModal({ workspaceId, onClose }: Props) {
  const [botToken, setBotToken] = useState('');
  const [channelUsername, setChannelUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('1p2p_token');
      const res = await fetch(`${API}/social/telegram/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ botToken, channelUsername, workspaceId }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      onClose(true);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center' }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="card" style={{ width:460,maxWidth:'90vw',padding:'1.5rem' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem' }}>
          <h2 style={{ fontSize:'1rem',fontWeight:700 }}>Connect Telegram Channel</h2>
          <button onClick={()=>onClose()} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'1.2rem' }}>✕</button>
        </div>
        <div style={{ background:'var(--bg-card)',border:'1px solid var(--border-default)',borderRadius:8,padding:'0.75rem',marginBottom:'1rem',fontSize:'0.8rem',color:'var(--text-muted)' }}>
          <strong style={{ color:'var(--text-primary)' }}>Setup steps:</strong><br/>
          1. Open Telegram and message <strong>@BotFather</strong><br/>
          2. Send <code>/newbot</code> and follow prompts to create a bot<br/>
          3. Copy the bot token (looks like <code>123456:ABC-DEF...</code>)<br/>
          4. Add your bot as <strong>Administrator</strong> to your channel<br/>
          5. Paste the bot token and channel username below
        </div>
        {error && <div className="alert-error" style={{ marginBottom:'0.75rem' }}>{error}</div>}
        <form onSubmit={connect}>
          <div className="form-group">
            <label className="form-label">Bot Token *</label>
            <input className="form-input" required value={botToken} onChange={e=>setBotToken(e.target.value)} placeholder="1234567890:AABBCC..." type="password" />
          </div>
          <div className="form-group">
            <label className="form-label">Channel Username *</label>
            <input className="form-input" required value={channelUsername} onChange={e=>setChannelUsername(e.target.value)} placeholder="@mychannel" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ background:'#2CA5E0',width:'100%' }} disabled={loading}>
            {loading ? 'Connecting…' : '✈ Connect Channel'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

Create `apps/web/components/platform-modals/TikTokModal.tsx`:

```typescript
'use client';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
type Props = { workspaceId: string; onClose: (connected?: boolean) => void };
export default function TikTokModal({ workspaceId, onClose }: Props) {
  function connect() {
    const token = localStorage.getItem('1p2p_token');
    window.location.href = `${API}/social/tiktok/auth?token=${token}&workspaceId=${workspaceId}`;
  }
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center' }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="card" style={{ width:420,maxWidth:'90vw',padding:'1.5rem' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem' }}>
          <h2 style={{ fontSize:'1rem',fontWeight:700 }}>Connect TikTok</h2>
          <button onClick={()=>onClose()} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'1.2rem' }}>✕</button>
        </div>
        <p style={{ color:'var(--text-muted)',fontSize:'0.875rem',marginBottom:'1rem' }}>
          Connect your TikTok account to schedule and publish video content.
        </p>
        <button className="btn btn-primary" style={{ background:'#010101',width:'100%' }} onClick={connect}>
          ♪ Connect TikTok
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/components/platform-modals/ && git commit -m "feat(web): platform connection modals for Instagram, Facebook, Twitter, YouTube, Threads, Telegram, TikTok"
```

---

## Task 10: Onboarding Layout and Pages

**Files:**
- Create: `apps/web/app/onboarding/layout.tsx`
- Create: `apps/web/app/onboarding/page.tsx`
- Create: `apps/web/app/onboarding/step-1/page.tsx`
- Create: `apps/web/app/onboarding/step-2/page.tsx`
- Create: `apps/web/app/onboarding/step-3/page.tsx`
- Create: `apps/web/app/onboarding/step-4/page.tsx`

- [ ] **Step 1: Create onboarding layout**

Create `apps/web/app/onboarding/layout.tsx`:

```typescript
import { ReactNode } from 'react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      {/* Brand header */}
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.03em' }}>
          <span style={{ color: '#E06028' }}>1</span>
          <span style={{ color: '#4B8EC4' }}>Place</span>
          <span style={{ color: '#E06028' }}>2</span>
          <span style={{ color: '#4B8EC4' }}>Post</span>
        </span>
      </div>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create onboarding index page (redirect)**

Create `apps/web/app/onboarding/page.tsx`:

```typescript
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/onboarding/step-1'); }, [router]);
  return null;
}
```

- [ ] **Step 3: Create Step 1 — Tell us about yourself**

Create `apps/web/app/onboarding/step-1/page.tsx`:

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { userApi } from '../../../lib/api';

const ROLES = [
  { value: 'CREATOR', label: 'Freelance Creator / Influencer' },
  { value: 'BUSINESS_OWNER', label: 'Small Business Owner' },
  { value: 'SOCIAL_MEDIA_MANAGER', label: 'Social Media Manager' },
  { value: 'AGENCY', label: 'Marketing Agency' },
  { value: 'OTHER', label: 'Other' },
];

export default function OnboardingStep1() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    if (!role) return;
    setSaving(true);
    try { await userApi.updateProfile({ userRole: role }); }
    catch { /* non-critical — continue anyway */ }
    finally { setSaving(false); }
    router.push('/onboarding/step-2');
  }

  return (
    <div>
      <StepIndicator current={1} total={4} />
      <div className="card" style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>First, tell us about yourself</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>This helps us tailor your experience.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {ROLES.map(r => (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              style={{
                padding: '0.875rem 1rem', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                fontWeight: 500, fontSize: '0.9rem',
                border: role === r.value ? '2px solid var(--brand-500)' : '1.5px solid var(--border-default)',
                background: role === r.value ? 'rgba(224,96,40,0.08)' : 'var(--bg-card)',
                color: role === r.value ? 'var(--brand-500)' : 'var(--text-primary)',
                transition: 'all 0.1s',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => router.push('/onboarding/step-2')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}>Skip</button>
          <button className="btn btn-primary" onClick={handleContinue} disabled={!role || saving}>
            {saving ? 'Saving…' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: '1.5rem' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i + 1 === current ? 24 : 8, height: 8, borderRadius: 4,
          background: i + 1 <= current ? 'var(--brand-500)' : 'var(--border-default)',
          transition: 'all 0.2s',
        }} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create Step 2 — Create workspace**

Create `apps/web/app/onboarding/step-2/page.tsx`:

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { workspaceApi, setActiveWorkspaceId } from '../../../lib/api';

const INDUSTRIES = [
  'Advertising & Marketing', 'Agency', 'E-commerce', 'Education', 'Entertainment',
  'Fashion & Beauty', 'Finance', 'Food & Beverage', 'Health & Wellness',
  'Non-profit', 'Real Estate', 'Retail', 'Technology', 'Travel & Hospitality', 'Other',
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display:'flex',gap:8,justifyContent:'center',marginBottom:'1.5rem' }}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{ width:i+1===current?24:8,height:8,borderRadius:4,background:i+1<=current?'var(--brand-500)':'var(--border-default)',transition:'all 0.2s' }} />
      ))}
    </div>
  );
}

export default function OnboardingStep2() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const ws = await workspaceApi.create({ name, industry: industry || undefined });
      setActiveWorkspaceId(ws.id);
      router.push('/onboarding/step-3');
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <StepIndicator current={2} total={4} />
      <div className="card" style={{ padding:'2rem' }}>
        <h1 style={{ fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem' }}>Create your workspace</h1>
        <p style={{ color:'var(--text-muted)',marginBottom:'1.5rem' }}>
          A workspace holds your social accounts, posts, and team members. You can create more workspaces later.
        </p>
        {error && <div className="alert-error" style={{ marginBottom:'1rem' }}>{error}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Workspace Name *</label>
            <input className="form-input" required value={name} onChange={e=>setName(e.target.value)} placeholder="My Brand, Acme Agency…" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Industry</label>
            <select className="form-input" value={industry} onChange={e=>setIndustry(e.target.value)}>
              <option value="">Select your industry…</option>
              {INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'1.5rem' }}>
            <button type="button" onClick={()=>router.back()} className="btn btn-ghost">← Back</button>
            <button type="submit" className="btn btn-primary" disabled={!name||saving}>
              {saving?'Creating…':'Create Workspace →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create Step 3 — Add social accounts**

Create `apps/web/app/onboarding/step-3/page.tsx`:

```typescript
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlatformGrid from '../../../components/PlatformGrid';
import { getActiveWorkspaceId } from '../../../lib/api';

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display:'flex',gap:8,justifyContent:'center',marginBottom:'1.5rem' }}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{ width:i+1===current?24:8,height:8,borderRadius:4,background:i+1<=current?'var(--brand-500)':'var(--border-default)',transition:'all 0.2s' }} />
      ))}
    </div>
  );
}

export default function OnboardingStep3() {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState('');
  const [connected, setConnected] = useState<string[]>([]);

  useEffect(() => {
    const wsId = getActiveWorkspaceId();
    if (!wsId) { router.push('/onboarding/step-2'); return; }
    setWorkspaceId(wsId);
  }, [router]);

  function handleConnected(platform: string) {
    setConnected(c => [...c, platform]);
  }

  if (!workspaceId) return null;

  return (
    <div>
      <StepIndicator current={3} total={4} />
      <div style={{ padding:'0 0 1rem' }}>
        <h1 style={{ fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem' }}>Add your social accounts</h1>
        <p style={{ color:'var(--text-muted)',marginBottom:'1.5rem' }}>
          Connect the platforms you manage. You can add more from the Connections page anytime.
        </p>
        {connected.length > 0 && (
          <div style={{ marginBottom:'1rem',padding:'0.5rem 0.75rem',borderRadius:8,background:'rgba(75,142,196,0.1)',border:'1px solid rgba(75,142,196,0.3)',fontSize:'0.875rem',color:'var(--text-primary)' }}>
            ✓ Connected: {connected.join(', ')}
          </div>
        )}
        <PlatformGrid workspaceId={workspaceId} onConnected={handleConnected} />
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'2rem' }}>
          <button onClick={()=>router.back()} className="btn btn-ghost">← Back</button>
          <button className="btn btn-primary" onClick={()=>router.push('/onboarding/step-4')}>
            {connected.length > 0 ? 'Continue →' : 'Skip for now →'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create Step 4 — You're all set**

Create `apps/web/app/onboarding/step-4/page.tsx`:

```typescript
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userApi } from '../../../lib/api';

export default function OnboardingStep4() {
  const router = useRouter();

  useEffect(() => {
    // Mark onboarding complete
    userApi.updateProfile({ onboardingCompletedAt: new Date() }).catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ display:'flex',gap:8,justifyContent:'center',marginBottom:'1.5rem' }}>
        {[1,2,3,4].map(i=>(
          <div key={i} style={{ width:24,height:8,borderRadius:4,background:'var(--brand-500)' }} />
        ))}
      </div>
      <div className="card" style={{ padding:'2.5rem',textAlign:'center' }}>
        <div style={{ fontSize:'3rem',marginBottom:'1rem' }}>🎉</div>
        <h1 style={{ fontSize:'1.75rem',fontWeight:800,marginBottom:'0.75rem' }}>You're all set!</h1>
        <p style={{ color:'var(--text-muted)',marginBottom:'2rem',lineHeight:1.6 }}>
          Your workspace is ready. Start by scheduling your first post or exploring the dashboard.
        </p>
        <div style={{ display:'flex',flexDirection:'column',gap:'0.75rem' }}>
          <button className="btn btn-primary" style={{ fontSize:'1rem',padding:'0.875rem' }} onClick={()=>router.push('/dashboard/posts/new')}>
            ✏️ Create Your First Post
          </button>
          <button className="btn btn-ghost" onClick={()=>router.push('/dashboard')}>
            Take me to the Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/app/onboarding/ && git commit -m "feat(onboarding): 4-step wizard — profile, workspace, social accounts, get started"
```

---

## Task 11: Redirect to Onboarding After Register/Login

**Files:**
- Modify: `apps/web/app/register/page.tsx`
- Modify: `apps/web/app/login/page.tsx`

- [ ] **Step 1: Update register page to redirect based on needsOnboarding**

Read `apps/web/app/register/page.tsx`. After the successful register call, change the redirect from `router.push('/dashboard')` to:

```typescript
if (data.needsOnboarding) {
  router.push('/onboarding/step-1');
} else {
  router.push('/dashboard');
}
```

The `register` API call returns `{ access_token: string; needsOnboarding: boolean }`. Update the register handler to read this flag.

- [ ] **Step 2: Update login page similarly**

Read `apps/web/app/login/page.tsx`. After successful login, apply the same redirect logic:

```typescript
if (data.needsOnboarding) {
  router.push('/onboarding/step-1');
} else {
  router.push('/dashboard');
}
```

- [ ] **Step 3: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/app/register/ apps/web/app/login/ && git commit -m "feat(auth): redirect new users to /onboarding/step-1 after register/login"
```

---

## Task 12: Redesign Connections Page with PlatformGrid

**Files:**
- Modify: `apps/web/app/dashboard/connections/page.tsx`

- [ ] **Step 1: Rewrite connections page**

Replace the entire content of `apps/web/app/dashboard/connections/page.tsx`:

```typescript
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveWorkspaceId, workspaceApi } from '../../../lib/api';
import PlatformGrid from '../../../components/PlatformGrid';

const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM:'Instagram', FACEBOOK:'Facebook', TWITTER:'Twitter/X',
  YOUTUBE:'YouTube', THREADS:'Threads', TELEGRAM:'Telegram', TIKTOK:'TikTok',
};

const TOKEN_STATUS_BADGE: Record<string, string> = {
  ACTIVE:'badge-published', TOKEN_EXPIRING:'badge-scheduled',
  TOKEN_CRITICAL:'badge-scheduled', TOKEN_EXPIRED:'badge-failed', DISCONNECTED:'badge-failed',
};

type SocialAccount = {
  id: string; platform: string; username: string | null; displayName: string | null;
  tokenStatus: string; tokenExpiry: string | null; isActive: boolean;
};

export default function ConnectionsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const wsId = getActiveWorkspaceId();
    if (!wsId) { router.push('/dashboard'); return; }
    setWorkspaceId(wsId);

    workspaceApi.socialAccounts(wsId)
      .then(setAccounts)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));

    // Handle OAuth redirect success/error params
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) setSuccessMsg(`Successfully connected!`);
  }, [router]);

  async function handleDisconnect(id: string) {
    if (!confirm('Disconnect this account?')) return;
    const token = localStorage.getItem('1p2p_token');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api'}/social-accounts/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    setAccounts(a => a.filter(x => x.id !== id));
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Connections</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(s => !s)}>
          {showAdd ? '✕ Hide' : '+ Connect Account'}
        </button>
      </div>

      {successMsg && (
        <div style={{ marginBottom:'1rem',padding:'0.75rem 1rem',borderRadius:8,background:'rgba(75,142,196,0.1)',border:'1px solid rgba(75,142,196,0.3)',fontSize:'0.875rem' }}>
          ✓ {successMsg}
        </div>
      )}

      {showAdd && workspaceId && (
        <div className="card" style={{ marginBottom:'1.5rem' }}>
          <h2 style={{ fontSize:'1rem',fontWeight:600,marginBottom:'1.25rem' }}>Choose a platform to connect</h2>
          <PlatformGrid workspaceId={workspaceId} onConnected={() => {
            workspaceApi.socialAccounts(workspaceId).then(setAccounts);
            setShowAdd(false);
          }} />
        </div>
      )}

      <div className="card">
        {loading ? (
          <p style={{ color:'var(--text-dim)' }}>Loading…</p>
        ) : accounts.length === 0 ? (
          <div className="empty">
            <h3>No connected accounts</h3>
            <p>Click "Connect Account" above to add your first social platform.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Platform</th><th>Account</th><th>Status</th><th>Expiry</th><th></th></tr></thead>
              <tbody>
                {accounts.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight:500 }}>{PLATFORM_LABELS[a.platform] ?? a.platform}</td>
                    <td style={{ color:'var(--text-muted)' }}>{a.username ?? a.displayName ?? '—'}</td>
                    <td><span className={`badge ${TOKEN_STATUS_BADGE[a.tokenStatus] ?? 'badge-draft'}`}>{a.tokenStatus}</span></td>
                    <td style={{ color:'var(--text-muted)',fontSize:'0.8rem' }}>
                      {a.tokenExpiry ? new Date(a.tokenExpiry).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <button className="btn btn-ghost" style={{ fontSize:'0.8rem',padding:'0.3rem 0.6rem' }} onClick={() => handleDisconnect(a.id)}>
                        Disconnect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/app/dashboard/connections/ && git commit -m "feat(connections): redesign with PlatformGrid — all platforms visible, Coming Soon for unimplemented"
```

---

## Task 13: QuickStart Section on Dashboard

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx`

- [ ] **Step 1: Add QuickStart component to dashboard**

Read `apps/web/app/dashboard/page.tsx`. Find a good location (e.g., between the stat strip and the recent posts feed) and add a Help/QuickStart section:

```typescript
{/* QuickStart / Help Section */}
<div className="card" style={{ marginBottom:'1.5rem' }}>
  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem' }}>
    <h2 style={{ fontSize:'1rem',fontWeight:600 }}>Getting Started</h2>
    <span style={{ fontSize:'0.75rem',color:'var(--text-muted)' }}>Quick guide</span>
  </div>
  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'1rem' }}>
    {[
      { step:'1', title:'Create a Workspace', desc:'Organize your accounts and team under one workspace.', href:'/dashboard/workspace', cta:'Open Workspace' },
      { step:'2', title:'Connect Accounts', desc:'Link your Instagram, Twitter, YouTube, and more.', href:'/dashboard/connections', cta:'Connect Now' },
      { step:'3', title:'Schedule Your First Post', desc:'Write a caption, pick a time, and let us handle the rest.', href:'/dashboard/posts/new', cta:'Create Post' },
      { step:'4', title:'Invite Your Team', desc:'Add members to collaborate on content.', href:'/dashboard/workspace', cta:'Add Members' },
    ].map(s => (
      <a key={s.step} href={s.href} style={{ textDecoration:'none' }}>
        <div style={{
          padding:'1rem',borderRadius:10,border:'1.5px solid var(--border-default)',
          background:'var(--bg-card)',cursor:'pointer',transition:'border-color 0.15s',
          display:'flex',flexDirection:'column',gap:'0.5rem',
        }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor='var(--brand-500)'}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor='var(--border-default)'}
        >
          <div style={{ width:28,height:28,borderRadius:'50%',background:'var(--brand-500)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.8rem',fontWeight:700 }}>{s.step}</div>
          <div style={{ fontWeight:600,fontSize:'0.875rem' }}>{s.title}</div>
          <div style={{ fontSize:'0.8rem',color:'var(--text-muted)',lineHeight:1.4 }}>{s.desc}</div>
          <div style={{ fontSize:'0.8rem',color:'var(--brand-500)',fontWeight:600,marginTop:'0.25rem' }}>{s.cta} →</div>
        </div>
      </a>
    ))}
  </div>
  <div style={{ marginTop:'1.25rem',padding:'0.75rem 1rem',borderRadius:8,background:'rgba(224,96,40,0.06)',border:'1px solid rgba(224,96,40,0.2)',display:'flex',alignItems:'center',gap:'0.75rem' }}>
    <span style={{ fontSize:'1.25rem' }}>🎬</span>
    <div>
      <div style={{ fontWeight:600,fontSize:'0.875rem' }}>QuickStart Video</div>
      <div style={{ fontSize:'0.8rem',color:'var(--text-muted)' }}>Watch a 2-minute walkthrough of the platform</div>
    </div>
    <button className="btn btn-primary" style={{ marginLeft:'auto',fontSize:'0.8rem',padding:'0.4rem 0.9rem' }}
      onClick={()=>alert('Video coming soon! Check back after launch.')}>
      Watch →
    </button>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/app/dashboard/page.tsx && git commit -m "feat(dashboard): Getting Started / QuickStart section with 4 guided steps and video placeholder"
```

---

## Task 14: Final Integration Test

- [ ] **Step 1: Run full API test suite**

```bash
cd /home/ubuntu/1P2P-main/apps/api && npx jest --no-coverage 2>&1 | tail -20
```

Expected: 86+ tests passing.

- [ ] **Step 2: TypeScript compile check for API**

```bash
cd /home/ubuntu/1P2P-main/apps/api && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: TypeScript compile check for web**

```bash
cd /home/ubuntu/1P2P-main/apps/web && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Manual smoke test — onboarding flow**

Start dev containers or run locally. Then verify:
1. Register new account → redirected to `/onboarding/step-1`
2. Select a role → Continue
3. Create workspace → name and industry saved
4. Platform grid shows all platforms, Coming Soon badges on LinkedIn/Pinterest/Bluesky/Mastodon/Snapchat
5. Click Instagram → modal appears with "Connect via Facebook" button
6. Click Telegram → bot token form with step-by-step instructions
7. Step 4 → dashboard loads, Getting Started section visible

- [ ] **Step 5: Final commit**

```bash
cd /home/ubuntu/1P2P-main && git add -A && git commit -m "feat: Phase 13b complete — onboarding wizard, platform grid, 5 new platform services, QuickStart section"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Post-registration onboarding wizard (Tasks 10, 11)
- [x] Platform grid with all platforms + Coming Soon (Task 8)
- [x] Instagram modal with account type context (Task 9)
- [x] Facebook Pages OAuth (Task 2)
- [x] Threads OAuth (Task 3)
- [x] YouTube OAuth (Task 4)
- [x] Telegram bot token connection (Task 5)
- [x] TikTok OAuth with PKCE (Task 6)
- [x] Twitter/X — existing, wired into grid (Task 8-9)
- [x] onboardingCompletedAt saved on Step 4 (Task 10 Step 6)
- [x] Connections page redesigned with PlatformGrid (Task 12)
- [x] QuickStart / Getting Started on dashboard (Task 13)
- [x] needsOnboarding flag from auth (Task 1 Step 3)

**Notes for implementation:**
- All new OAuth platforms require their respective Developer App credentials added to `.env`. Telegram requires no credentials. YouTube reuses `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`.
- The QuickStart video placeholder uses `alert()` — replace with a modal or embedded video player once a real video is produced.
- The `ModalShell` component in `InstagramModal.tsx` is defined inline. If more modals are added later, extract it to `components/platform-modals/ModalShell.tsx`.
