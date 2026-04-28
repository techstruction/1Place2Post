# Workspace Architecture Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing `Team`/`TeamMember` model with a `Workspace`/`WorkspaceMember` model that becomes the organizational hub of 1Place2Post — social accounts, posts, and members all belong to a workspace. Users can own or join multiple workspaces.

**Architecture:** Clean schema migration (no real user data to preserve at this stage). `Workspace` replaces `Team`. `SocialAccount` gains a required `workspaceId` foreign key — the account belongs to the workspace, not the individual user (the `userId` becomes an audit field for who connected it). `WorkspaceRole` gains a `SUPERVISOR` tier between ADMIN and MEMBER. Frontend gets a workspace switcher in the sidebar and a workspace settings page replacing the team page. OAuth flows carry `workspaceId` through the state parameter so callbacks know where to store the new social account.

**Tech Stack:** Prisma (PostgreSQL), NestJS (Modules, Guards, Decorators), Next.js 15 App Router, TypeScript

---

## File Map

**Created:**
- `apps/api/src/workspace/workspace.module.ts`
- `apps/api/src/workspace/workspace.controller.ts`
- `apps/api/src/workspace/workspace.service.ts`
- `apps/api/src/workspace/workspace.service.spec.ts`
- `apps/api/src/workspace/dto/workspace.dto.ts`
- `apps/api/src/workspace/guards/workspace-access.guard.ts`
- `apps/web/app/dashboard/workspace/page.tsx`

**Modified:**
- `apps/api/prisma/schema.prisma` — replace Team→Workspace, add workspaceId to SocialAccount/Post/AuditLog, add WorkspaceRole/UserRole enums, add THREADS+TELEGRAM to Platform enum, add onboardingCompletedAt+userRole to User
- `apps/api/src/app.module.ts` — swap `TeamModule` → `WorkspaceModule`
- `apps/api/src/social-account/social-account.service.ts` — workspace-scoped queries
- `apps/api/src/social-account/social-account.controller.ts` — expose workspace endpoint
- `apps/api/src/social/instagram/instagram.service.ts` — workspaceId in OAuth state
- `apps/api/src/social/instagram/instagram.controller.ts` — workspaceId query param
- `apps/api/src/social/twitter/twitter.service.ts` — workspaceId in state store
- `apps/api/src/social/twitter/twitter.controller.ts` — workspaceId query param
- `apps/web/app/dashboard/layout.tsx` — workspace switcher section, rename Team→Workspace nav
- `apps/web/app/dashboard/connections/page.tsx` — pass activeWorkspaceId to OAuth URLs
- `apps/web/lib/api.ts` — workspace API helpers

**Deleted:**
- `apps/api/src/team/` (entire directory — replaced by workspace module)
- `apps/web/app/dashboard/team/page.tsx` (replaced by workspace/page.tsx)

---

## Task 1: Schema Migration — Workspace Models

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Auto-created: `apps/api/prisma/migrations/<timestamp>_workspace_architecture/`

- [ ] **Step 1: Replace the Team section (lines ~360-392) in schema.prisma**

Find and replace the entire `// Phase 3: Teams` block (Team, TeamMember, TeamRole) and the `// Phase 3: Audit Log` block with the following. Use `Read` on the schema to verify exact line numbers before editing.

```prisma
// ─────────────────────────────────────────────
// Phase 3: Workspaces (replaces Team)
// ─────────────────────────────────────────────

model Workspace {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  industry  String?
  ownerId   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  owner          User              @relation("WorkspaceOwner", fields: [ownerId], references: [id])
  members        WorkspaceMember[]
  socialAccounts SocialAccount[]
  posts          Post[]
  auditLogs      AuditLog[]
}

model WorkspaceMember {
  id          String        @id @default(cuid())
  workspaceId String
  userId      String
  role        WorkspaceRole @default(MEMBER)
  createdAt   DateTime      @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
}

enum WorkspaceRole {
  OWNER
  ADMIN
  SUPERVISOR
  MEMBER
}

// ─────────────────────────────────────────────
// Phase 3: Audit Log
// ─────────────────────────────────────────────

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  workspaceId String?
  entityType  String
  entityId    String?
  action      String
  metaJson    String   @default("{}")
  createdAt   DateTime @default(now())

  workspace Workspace? @relation(fields: [workspaceId], references: [id], onDelete: SetNull)
}
```

- [ ] **Step 2: Update the User model (around line 17)**

Add the following fields inside the `User` model (after the existing `role` field and relations). Remove the `teamMemberships TeamMember[]` line and add:

```prisma
  onboardingCompletedAt DateTime?
  userRole              UserRole?

  ownedWorkspaces      Workspace[]       @relation("WorkspaceOwner")
  workspaceMemberships WorkspaceMember[]
```

Also add the new enum after the existing `Role` enum:

```prisma
enum UserRole {
  CREATOR
  AGENCY
  BUSINESS_OWNER
  SOCIAL_MEDIA_MANAGER
  OTHER
}
```

- [ ] **Step 3: Add workspaceId to SocialAccount model (around line 56)**

Add inside `SocialAccount` model, after `userId String`:

```prisma
  workspaceId  String
  workspace    Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
```

And change the unique constraint at the bottom of the model from:
```prisma
  @@unique([userId, platform, platformId])
```
to:
```prisma
  @@unique([workspaceId, platform, platformId])
```

- [ ] **Step 4: Add workspaceId to Post model (around line 112)**

Add inside `Post` model after `userId String`:

```prisma
  workspaceId  String?
  workspace    Workspace?  @relation(fields: [workspaceId], references: [id], onDelete: SetNull)
```

- [ ] **Step 5: Add THREADS and TELEGRAM to Platform enum (around line 83)**

Change:
```prisma
enum Platform {
  INSTAGRAM
  TIKTOK
  FACEBOOK
  YOUTUBE
  TWITTER
}
```
to:
```prisma
enum Platform {
  INSTAGRAM
  TIKTOK
  FACEBOOK
  YOUTUBE
  TWITTER
  THREADS
  TELEGRAM
}
```

- [ ] **Step 6: Run the migration**

```bash
cd /home/ubuntu/1P2P-main/apps/api && npx prisma migrate dev --name workspace_architecture
```

Expected: migration created and applied, Prisma client regenerated. If it reports schema drift, run `npx prisma migrate reset --force` first (this drops all data — acceptable at this dev stage).

- [ ] **Step 7: Verify Prisma client is generated**

```bash
cd /home/ubuntu/1P2P-main/apps/api && npx prisma generate
```

Expected: `Generated Prisma Client` with no errors.

- [ ] **Step 8: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/api/prisma/ && git commit -m "feat(schema): workspace architecture — replace Team with Workspace, add workspaceId to SocialAccount/Post, add WorkspaceRole/UserRole enums, add THREADS+TELEGRAM platforms"
```

---

## Task 2: Workspace API — DTOs and Service

**Files:**
- Create: `apps/api/src/workspace/dto/workspace.dto.ts`
- Create: `apps/api/src/workspace/workspace.service.ts`
- Create: `apps/api/src/workspace/workspace.service.spec.ts`

- [ ] **Step 1: Write the failing service test**

Create `apps/api/src/workspace/workspace.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { WorkspaceService } from './workspace.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';

const mockPrisma = {
  workspace: { create: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
  workspaceMember: {
    findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(),
    create: jest.fn(), update: jest.fn(), delete: jest.fn(),
  },
  user: { findUnique: jest.fn() },
};

describe('WorkspaceService', () => {
  let service: WorkspaceService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(WorkspaceService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a workspace and adds creator as OWNER', async () => {
      mockPrisma.workspace.create.mockResolvedValue({ id: 'ws1', name: 'Acme', members: [] });
      const result = await service.create('user1', { name: 'Acme', industry: 'Tech' });
      expect(mockPrisma.workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ownerId: 'user1', name: 'Acme' }),
        })
      );
      expect(result.id).toBe('ws1');
    });
  });

  describe('invite', () => {
    it('throws ForbiddenException if requester is not OWNER or ADMIN', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      await expect(service.invite('u1', 'ws1', { email: 'x@x.com' })).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if invitee email does not exist', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.invite('u1', 'ws1', { email: 'ghost@x.com' })).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException if invitee is already a member', async () => {
      mockPrisma.workspaceMember.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN' })
        .mockResolvedValueOnce({ id: 'existing' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u2' });
      await expect(service.invite('u1', 'ws1', { email: 'x@x.com' })).rejects.toThrow(ConflictException);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/ubuntu/1P2P-main/apps/api && npx jest workspace.service.spec.ts --no-coverage 2>&1 | tail -20
```

Expected: FAIL — `WorkspaceService` not found.

- [ ] **Step 3: Create DTOs**

Create `apps/api/src/workspace/dto/workspace.dto.ts`:

```typescript
import { IsString, IsOptional, IsEmail, IsIn } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString() name: string;
  @IsOptional() @IsString() industry?: string;
}

export class InviteMemberDto {
  @IsEmail() email: string;
  @IsOptional() @IsIn(['ADMIN', 'SUPERVISOR', 'MEMBER']) role?: string;
}

export class UpdateMemberRoleDto {
  @IsIn(['ADMIN', 'SUPERVISOR', 'MEMBER']) role: string;
}
```

- [ ] **Step 4: Create WorkspaceService**

Create `apps/api/src/workspace/workspace.service.ts`:

```typescript
import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto, InviteMemberDto, UpdateMemberRoleDto } from './dto/workspace.dto';

const MANAGE_ROLES = ['OWNER', 'ADMIN'];

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);
    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug,
        industry: dto.industry,
        ownerId: userId,
        members: { create: { userId, role: 'OWNER' } },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
  }

  async findMine(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: { select: { socialAccounts: true, members: true } },
          },
        },
      },
    });
    return memberships.map(m => ({ ...m.workspace, myRole: m.role }));
  }

  async findOne(workspaceId: string, userId: string) {
    await this.assertMember(workspaceId, userId);
    return this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { socialAccounts: true, posts: true } },
      },
    });
  }

  async invite(requesterId: string, workspaceId: string, dto: InviteMemberDto) {
    const myMembership = await this.assertRole(workspaceId, requesterId, MANAGE_ROLES);

    const invitee = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!invitee) throw new NotFoundException(`No user with email ${dto.email}`);

    const existing = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: invitee.id } },
    });
    if (existing) throw new ConflictException('User is already a workspace member');

    return this.prisma.workspaceMember.create({
      data: { workspaceId, userId: invitee.id, role: (dto.role as any) ?? 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async updateMemberRole(requesterId: string, workspaceId: string, targetUserId: string, dto: UpdateMemberRoleDto) {
    await this.assertRole(workspaceId, requesterId, ['OWNER']);
    if (dto.role === 'OWNER') throw new ForbiddenException('Ownership transfer requires admin action');

    const target = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
    if (!target) throw new NotFoundException('Member not found');

    return this.prisma.workspaceMember.update({
      where: { id: target.id },
      data: { role: dto.role as any },
    });
  }

  async removeMember(requesterId: string, workspaceId: string, targetUserId: string) {
    await this.assertRole(workspaceId, requesterId, MANAGE_ROLES);
    if (targetUserId === requesterId) throw new ForbiddenException('Cannot remove yourself');

    const target = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'OWNER') throw new ForbiddenException('Cannot remove workspace owner');

    return this.prisma.workspaceMember.delete({ where: { id: target.id } });
  }

  private async assertMember(workspaceId: string, userId: string) {
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!m) throw new ForbiddenException('Not a member of this workspace');
    return m;
  }

  private async assertRole(workspaceId: string, userId: string, roles: string[]) {
    const m = await this.assertMember(workspaceId, userId);
    if (!roles.includes(m.role)) {
      throw new ForbiddenException(`Requires one of: ${roles.join(', ')}`);
    }
    return m;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /home/ubuntu/1P2P-main/apps/api && npx jest workspace.service.spec.ts --no-coverage 2>&1 | tail -20
```

Expected: PASS — all 4 tests green.

- [ ] **Step 6: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/api/src/workspace/ && git commit -m "feat(workspace): WorkspaceService with create/invite/remove/role update"
```

---

## Task 3: Workspace Controller and Module

**Files:**
- Create: `apps/api/src/workspace/workspace.controller.ts`
- Create: `apps/api/src/workspace/workspace.module.ts`

- [ ] **Step 1: Create WorkspaceController**

Create `apps/api/src/workspace/workspace.controller.ts`:

```typescript
import {
  Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto, InviteMemberDto, UpdateMemberRoleDto } from './dto/workspace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateWorkspaceDto) {
    return this.workspaceService.create(req.user.id, dto);
  }

  @Get('mine')
  findMine(@Req() req: any) {
    return this.workspaceService.findMine(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.workspaceService.findOne(id, req.user.id);
  }

  @Post(':id/members')
  invite(@Req() req: any, @Param('id') id: string, @Body() dto: InviteMemberDto) {
    return this.workspaceService.invite(req.user.id, id, dto);
  }

  @Patch(':id/members/:userId')
  updateRole(
    @Req() req: any,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspaceService.updateMemberRole(req.user.id, id, userId, dto);
  }

  @Delete(':id/members/:userId')
  removeMember(@Req() req: any, @Param('id') id: string, @Param('userId') userId: string) {
    return this.workspaceService.removeMember(req.user.id, id, userId);
  }
}
```

- [ ] **Step 2: Create WorkspaceModule**

Create `apps/api/src/workspace/workspace.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
```

- [ ] **Step 3: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/api/src/workspace/ && git commit -m "feat(workspace): WorkspaceController and WorkspaceModule"
```

---

## Task 4: Update AppModule — Swap TeamModule for WorkspaceModule

**Files:**
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Update the import in app.module.ts**

Change:
```typescript
import { TeamModule } from './team/team.module';
```
to:
```typescript
import { WorkspaceModule } from './workspace/workspace.module';
```

And in the `imports` array, replace `TeamModule` with `WorkspaceModule`.

- [ ] **Step 2: Build the API to verify no compile errors**

```bash
cd /home/ubuntu/1P2P-main/apps/api && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors (or only pre-existing errors unrelated to workspace).

- [ ] **Step 3: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/api/src/app.module.ts && git commit -m "chore(api): swap TeamModule for WorkspaceModule in AppModule"
```

---

## Task 5: Update SocialAccount Service — Workspace Scoping

The `SocialAccount` now has a required `workspaceId`. Update the service so all queries are workspace-scoped (the caller specifies which workspace).

**Files:**
- Modify: `apps/api/src/social-account/social-account.service.ts`
- Modify: `apps/api/src/social-account/social-account.controller.ts`

- [ ] **Step 1: Update SocialAccountService**

Replace the content of `apps/api/src/social-account/social-account.service.ts`:

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenHealthService } from '../token-health/token-health.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';

@Injectable()
export class SocialAccountService {
  constructor(
    private prisma: PrismaService,
    private tokenHealth: TokenHealthService,
  ) {}

  async findAllForWorkspace(workspaceId: string) {
    return this.prisma.socialAccount.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, platform: true, platformId: true, username: true, displayName: true,
        tokenExpiry: true, tokenStatus: true, isActive: true, scopes: true,
        metaJson: true, createdAt: true, updatedAt: true,
      },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.socialAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, platform: true, platformId: true, username: true, displayName: true,
        tokenExpiry: true, tokenStatus: true, isActive: true, workspaceId: true,
      },
    });
  }

  create(userId: string, workspaceId: string, dto: CreateSocialAccountDto) {
    return this.prisma.socialAccount.create({
      data: {
        userId,
        workspaceId,
        platform: dto.platform,
        platformId: dto.platformId,
        username: dto.username,
        displayName: dto.displayName,
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        tokenExpiry: dto.tokenExpiry ? new Date(dto.tokenExpiry) : null,
        scopes: dto.scopes ?? [],
      },
    });
  }

  async updateTokens(
    userId: string,
    id: string,
    tokens: { accessToken: string; refreshToken?: string | null; tokenExpiry?: Date | null },
  ): Promise<void> {
    const account = await this.prisma.socialAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Social account not found');
    if (account.userId !== userId) throw new ForbiddenException();

    await this.prisma.socialAccount.update({
      where: { id },
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? account.refreshToken,
        tokenExpiry: tokens.tokenExpiry ?? account.tokenExpiry,
        tokenStatus: 'ACTIVE',
      },
    });

    await this.tokenHealth.unblockJobsForAccount(id);
  }

  async remove(userId: string, id: string) {
    const account = await this.prisma.socialAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Social account not found');
    if (account.userId !== userId) throw new ForbiddenException();
    return this.prisma.socialAccount.delete({ where: { id } });
  }
}
```

- [ ] **Step 2: Update SocialAccountController to expose workspace endpoint**

Read `apps/api/src/social-account/social-account.controller.ts` and add a new route for workspace-scoped listing. The existing `/social-accounts` route (user-scoped) can be kept for backward compat. Add:

```typescript
// Add to existing SocialAccountController:

@Get('workspace/:workspaceId')
findForWorkspace(@Param('workspaceId') workspaceId: string) {
  return this.socialAccountService.findAllForWorkspace(workspaceId);
}
```

Also update the `create` endpoint to accept `workspaceId` in the body (update the DTO to include `workspaceId: string`).

- [ ] **Step 3: Update CreateSocialAccountDto**

Open `apps/api/src/social-account/dto/create-social-account.dto.ts` and add:

```typescript
@IsString() workspaceId: string;
```

- [ ] **Step 4: Verify compile**

```bash
cd /home/ubuntu/1P2P-main/apps/api && npx tsc --noEmit 2>&1 | head -30
```

Expected: clean or only pre-existing issues.

- [ ] **Step 5: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/api/src/social-account/ && git commit -m "feat(social-account): workspace-scoped queries — findAllForWorkspace, workspaceId in create"
```

---

## Task 6: Update OAuth State to Carry workspaceId

When a user clicks "Connect Instagram" or "Connect Twitter" in the Connections page, they must pass their active `workspaceId`. This gets embedded in the OAuth `state` parameter and retrieved on callback to store the social account against the correct workspace.

**Files:**
- Modify: `apps/api/src/social/instagram/instagram.service.ts`
- Modify: `apps/api/src/social/instagram/instagram.controller.ts`
- Modify: `apps/api/src/social/twitter/twitter.service.ts`
- Modify: `apps/api/src/social/twitter/twitter.controller.ts`

- [ ] **Step 1: Update InstagramService.getAuthUrl to accept workspaceId**

In `apps/api/src/social/instagram/instagram.service.ts`, change:

```typescript
getAuthUrl(userId: string): string {
  // ...
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
```

to:

```typescript
getAuthUrl(userId: string, workspaceId: string): string {
  // ...
  const state = Buffer.from(JSON.stringify({ userId, workspaceId })).toString('base64');
```

- [ ] **Step 2: Update InstagramService.handleCallback to use workspaceId**

In `handleCallback`, change the `upsert` call to include `workspaceId`:

```typescript
const { userId, workspaceId } = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));
```

And in both `update` and `create` data blocks, add `workspaceId` to the create block:

```typescript
create: {
  userId,
  workspaceId,   // ← add this
  platform: Platform.INSTAGRAM,
  // ...rest unchanged
}
```

Change the `where` clause too:

```typescript
where: {
  workspaceId_platform_platformId: {
    workspaceId,
    platform: Platform.INSTAGRAM,
    platformId: fbUserId,
  },
},
```

- [ ] **Step 3: Update InstagramController to accept workspaceId query param**

In `apps/api/src/social/instagram/instagram.controller.ts`, update `connect`:

```typescript
@Get('auth')
async connect(@Req() req: any, @Query('workspaceId') workspaceId: string, @Res() res: ExpressResponse) {
  const userId = req.user?.id;
  if (!userId || !workspaceId) throw new UnauthorizedException('userId and workspaceId required');
  const authUrl = this.instagramService.getAuthUrl(userId, workspaceId);
  return res.redirect(authUrl);
}
```

- [ ] **Step 4: Apply the same pattern to TwitterService**

In `apps/api/src/social/twitter/twitter.service.ts`:

Change `getAuthUrl(userId: string)` to `getAuthUrl(userId: string, workspaceId: string)`.

In `tempAuthStore.set(state, ...)`, store `workspaceId` alongside `codeVerifier` and `userId`:

```typescript
this.tempAuthStore.set(state, { codeVerifier, userId, workspaceId });
```

In `handleCallback`, destructure `workspaceId` from `authData` and add it to the `upsert` create block:

```typescript
const { codeVerifier, userId, workspaceId } = authData;
// ...
create: {
  userId,
  workspaceId,   // ← add this
  platform: Platform.TWITTER,
  // ...rest unchanged
}
```

Change the `where` clause:

```typescript
where: {
  workspaceId_platform_platformId: {
    workspaceId,
    platform: Platform.TWITTER,
    platformId: twitterUserId,
  },
},
```

Update `TwitterController` to accept `workspaceId` query param (same pattern as Instagram).

- [ ] **Step 5: Verify compile**

```bash
cd /home/ubuntu/1P2P-main/apps/api && npx tsc --noEmit 2>&1 | head -30
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/api/src/social/ && git commit -m "feat(oauth): embed workspaceId in OAuth state for Instagram and Twitter callbacks"
```

---

## Task 7: Frontend — Workspace API Helpers

**Files:**
- Modify: `apps/web/lib/api.ts`

- [ ] **Step 1: Add workspace API calls to lib/api.ts**

Open `apps/web/lib/api.ts` and add after existing exports:

```typescript
// ── Workspace ─────────────────────────────────────────────────────────────

export const workspaceApi = {
  list: (): Promise<WorkspaceWithRole[]> =>
    authFetch('/workspaces/mine').then(r => r.json()),

  create: (body: { name: string; industry?: string }): Promise<WorkspaceWithRole> =>
    authFetch('/workspaces', { method: 'POST', body: JSON.stringify(body) }).then(r => r.json()),

  get: (id: string): Promise<WorkspaceDetail> =>
    authFetch(`/workspaces/${id}`).then(r => r.json()),

  invite: (workspaceId: string, body: { email: string; role?: string }) =>
    authFetch(`/workspaces/${workspaceId}/members`, { method: 'POST', body: JSON.stringify(body) }).then(r => r.json()),

  updateRole: (workspaceId: string, userId: string, role: string) =>
    authFetch(`/workspaces/${workspaceId}/members/${userId}`, { method: 'PATCH', body: JSON.stringify({ role }) }).then(r => r.json()),

  removeMember: (workspaceId: string, userId: string) =>
    authFetch(`/workspaces/${workspaceId}/members/${userId}`, { method: 'DELETE' }).then(r => r.json()),

  socialAccounts: (workspaceId: string) =>
    authFetch(`/social-accounts/workspace/${workspaceId}`).then(r => r.json()),
};

// Workspace active workspace helpers (localStorage)
export function getActiveWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('1p2p_activeWorkspace');
}

export function setActiveWorkspaceId(id: string) {
  if (typeof window !== 'undefined') localStorage.setItem('1p2p_activeWorkspace', id);
}

// Types
export type WorkspaceWithRole = {
  id: string; name: string; slug: string; industry: string | null;
  ownerId: string; myRole: string;
  _count: { socialAccounts: number; members: number };
};

export type WorkspaceDetail = WorkspaceWithRole & {
  members: Array<{ id: string; role: string; user: { id: string; name: string | null; email: string } }>;
};
```

- [ ] **Step 2: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/lib/api.ts && git commit -m "feat(web): workspace API helpers and localStorage active workspace"
```

---

## Task 8: Frontend — Workspace Settings Page

**Files:**
- Create: `apps/web/app/dashboard/workspace/page.tsx`
- Delete: `apps/web/app/dashboard/team/page.tsx`

- [ ] **Step 1: Create the workspace page**

Create `apps/web/app/dashboard/workspace/page.tsx`:

```typescript
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  workspaceApi, getActiveWorkspaceId, setActiveWorkspaceId,
  WorkspaceWithRole, WorkspaceDetail,
} from '../../../lib/api';

const ROLE_BADGE: Record<string, string> = {
  OWNER: 'badge-published', ADMIN: 'badge-scheduled',
  SUPERVISOR: 'badge-draft', MEMBER: 'badge-draft',
};
const ROLE_OPTIONS = ['ADMIN', 'SUPERVISOR', 'MEMBER'];
const INDUSTRIES = [
  'Advertising & Marketing', 'Agency', 'E-commerce', 'Education', 'Entertainment',
  'Fashion & Beauty', 'Finance', 'Food & Beverage', 'Health & Wellness',
  'Non-profit', 'Real Estate', 'Retail', 'Technology', 'Travel & Hospitality', 'Other',
];

export default function WorkspacePage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [active, setActive] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const list = await workspaceApi.list();
      setWorkspaces(list);
      if (list.length === 0) { setLoading(false); return; }
      const activeId = getActiveWorkspaceId() ?? list[0].id;
      const detail = await workspaceApi.get(activeId);
      setActive(detail);
      setActiveWorkspaceId(activeId);
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const ws = await workspaceApi.create({ name: newName, industry: newIndustry || undefined });
      setWorkspaces(w => [...w, ws]);
      setActiveWorkspaceId(ws.id);
      const detail = await workspaceApi.get(ws.id);
      setActive(detail);
      setCreating(false); setNewName(''); setNewIndustry('');
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    setSaving(true); setError('');
    try {
      const member = await workspaceApi.invite(active.id, { email: inviteEmail, role: inviteRole });
      setActive(a => a ? { ...a, members: [...a.members, member] } : a);
      setInviteEmail('');
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleRemove(userId: string) {
    if (!active || !confirm('Remove this member?')) return;
    await workspaceApi.removeMember(active.id, userId);
    setActive(a => a ? { ...a, members: a.members.filter(m => m.user.id !== userId) } : a);
  }

  async function handleRoleChange(userId: string, role: string) {
    if (!active) return;
    await workspaceApi.updateRole(active.id, userId, role);
    setActive(a => a ? { ...a, members: a.members.map(m => m.user.id === userId ? { ...m, role } : m) } : a);
  }

  function switchWorkspace(id: string) {
    setActiveWorkspaceId(id);
    workspaceApi.get(id).then(setActive);
  }

  if (loading) return <div className="card"><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div>;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Workspace</h1>
        <button className="btn btn-primary" onClick={() => setCreating(c => !c)}>
          {creating ? '✕ Cancel' : '+ New Workspace'}
        </button>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {creating && (
        <div className="card" style={{ maxWidth: 480, marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Create Workspace</h2>
          <form onSubmit={createWorkspace}>
            <div className="form-group">
              <label className="form-label">Workspace Name *</label>
              <input className="form-input" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Acme Agency" />
            </div>
            <div className="form-group">
              <label className="form-label">Industry</label>
              <select className="form-input" value={newIndustry} onChange={e => setNewIndustry(e.target.value)}>
                <option value="">Select industry…</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create'}</button>
          </form>
        </div>
      )}

      {workspaces.length > 1 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Your Workspaces</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => switchWorkspace(ws.id)}
                className={`btn ${active?.id === ws.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.875rem' }}
              >
                {ws.name}
                <span style={{ marginLeft: 6, opacity: 0.6, fontSize: '0.75rem' }}>{ws.myRole}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!active && workspaces.length === 0 ? (
        <div className="card empty">
          <h3>No workspace yet</h3>
          <p>Create a workspace to connect social accounts and invite team members.</p>
        </div>
      ) : active && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{active.name}</div>
                {active.industry && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{active.industry}</div>}
              </div>
              <span className="badge badge-published">{active.myRole}</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
                <tbody>
                  {active.members.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 500 }}>{m.user.name ?? '—'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{m.user.email}</td>
                      <td>
                        {m.role === 'OWNER' || active.myRole !== 'OWNER'
                          ? <span className={`badge ${ROLE_BADGE[m.role] ?? 'badge-draft'}`}>{m.role}</span>
                          : (
                            <select
                              className="form-input"
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', width: 'auto' }}
                              value={m.role}
                              onChange={e => handleRoleChange(m.user.id, e.target.value)}
                            >
                              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          )}
                      </td>
                      <td>
                        {m.role !== 'OWNER' && ['OWNER', 'ADMIN'].includes(active.myRole) && (
                          <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }} onClick={() => handleRemove(m.user.id)}>Remove</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {['OWNER', 'ADMIN'].includes(active.myRole) && (
            <div className="card" style={{ maxWidth: 480 }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Invite Member</h2>
              <form onSubmit={handleInvite}>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-input" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Inviting…' : 'Send Invite'}</button>
              </form>
            </div>
          )}
        </>
      )}
    </>
  );
}
```

- [ ] **Step 2: Delete the old team page**

```bash
rm /home/ubuntu/1P2P-main/apps/web/app/dashboard/team/page.tsx
```

- [ ] **Step 3: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/app/dashboard/ && git commit -m "feat(web): workspace settings page with member management and workspace switcher"
```

---

## Task 9: Frontend — Sidebar Workspace Switcher + Nav Update

**Files:**
- Modify: `apps/web/app/dashboard/layout.tsx`

- [ ] **Step 1: Update the NAV_ITEMS array**

Change:
```typescript
{ href: '/dashboard/team', label: 'Team', icon: TeamIcon },
```
to:
```typescript
{ href: '/dashboard/workspace', label: 'Workspace', icon: TeamIcon },
```

- [ ] **Step 2: Add workspace state and switcher to the layout**

Add a workspace switcher between the logo section and the nav. Add the following state and fetch:

```typescript
const [workspaces, setWorkspaces] = useState<{ id: string; name: string; myRole: string }[]>([]);
const [activeWsName, setActiveWsName] = useState<string>('');
const [showWsSwitcher, setShowWsSwitcher] = useState(false);
```

In the first `useEffect` (after the admin check), add:

```typescript
useEffect(() => {
  const token = localStorage.getItem('1p2p_token');
  if (!token) return;
  fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api'}/workspaces/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(r => r.ok ? r.json() : [])
    .then((list: { id: string; name: string; myRole: string }[]) => {
      setWorkspaces(list);
      const activeId = localStorage.getItem('1p2p_activeWorkspace') ?? list[0]?.id;
      const active = list.find(w => w.id === activeId) ?? list[0];
      if (active) { setActiveWsName(active.name); localStorage.setItem('1p2p_activeWorkspace', active.id); }
    })
    .catch(() => {});
}, []);
```

- [ ] **Step 3: Add the workspace switcher UI block**

Add this between the logo `<div>` and the `<nav>` element in the sidebar:

```tsx
{workspaces.length > 0 && !isCollapsed && (
  <div style={{ padding: '0.25rem 0', borderBottom: '1px solid var(--border-default)', marginBottom: '0.5rem' }}>
    <button
      onClick={() => setShowWsSwitcher(s => !s)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: 8,
        padding: '6px 10px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600,
      }}
    >
      <span style={{
        width: 24, height: 24, borderRadius: 6, background: 'var(--brand-500)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>
        {activeWsName.charAt(0).toUpperCase()}
      </span>
      <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeWsName}</span>
      <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>
    </button>
    {showWsSwitcher && (
      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {workspaces.map(ws => (
          <button
            key={ws.id}
            onClick={() => {
              localStorage.setItem('1p2p_activeWorkspace', ws.id);
              setActiveWsName(ws.name);
              setShowWsSwitcher(false);
              window.location.reload();
            }}
            style={{
              background: 'none', border: 'none', textAlign: 'left', padding: '5px 10px',
              borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem',
              fontWeight: localStorage.getItem('1p2p_activeWorkspace') === ws.id ? 700 : 400,
            }}
          >
            {ws.name}
          </button>
        ))}
        <button
          onClick={() => { router.push('/dashboard/workspace'); setShowWsSwitcher(false); }}
          style={{ background: 'none', border: 'none', textAlign: 'left', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', color: 'var(--brand-500)', fontSize: '0.8rem' }}
        >
          + New Workspace
        </button>
      </div>
    )}
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/app/dashboard/layout.tsx && git commit -m "feat(sidebar): workspace switcher, rename Team→Workspace nav item"
```

---

## Task 10: Frontend — Connections Page Passes workspaceId

**Files:**
- Modify: `apps/web/app/dashboard/connections/page.tsx`

- [ ] **Step 1: Read activeWorkspaceId from localStorage in the connections page**

At the top of the `ConnectionsPage` function, add:

```typescript
const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

useEffect(() => {
  const wsId = localStorage.getItem('1p2p_activeWorkspace');
  setActiveWorkspaceId(wsId);
}, []);
```

- [ ] **Step 2: Use workspaceId when loading accounts and connecting**

Change the initial load from `socialApi.list()` to fetch workspace-scoped accounts:

```typescript
useEffect(() => {
  const wsId = localStorage.getItem('1p2p_activeWorkspace');
  setActiveWorkspaceId(wsId);
  if (!wsId) { setLoading(false); return; }
  socialApi.listForWorkspace(wsId)
    .then(setAccounts)
    .catch(() => router.push('/login'))
    .finally(() => setLoading(false));
}, [router]);
```

Add `listForWorkspace` to `socialApi` in `lib/api.ts`:

```typescript
listForWorkspace: (workspaceId: string) =>
  authFetch(`/social-accounts/workspace/${workspaceId}`).then(r => r.json()),
```

- [ ] **Step 3: Update the Meta OAuth button to pass workspaceId**

Change:
```typescript
window.location.href = `http://localhost:35763/api/social/instagram/auth?token=${token}`;
```
to:
```typescript
window.location.href = `http://localhost:35763/api/social/instagram/auth?token=${token}&workspaceId=${activeWorkspaceId}`;
```

Wait, the Instagram auth endpoint is guarded by JWT — the token is in the JWT guard, not as a query param. The current implementation passes the JWT token as a query param which is a security concern. For now, keep the existing pattern but add workspaceId:

```typescript
const token = localStorage.getItem('1p2p_token');
const wsId = localStorage.getItem('1p2p_activeWorkspace');
window.location.href = `/api/social/instagram/auth?token=${token}&workspaceId=${wsId}`;
```

Note: The API URL should use NEXT_PUBLIC_API_URL not hardcoded localhost. Update accordingly.

- [ ] **Step 4: Update manual form to include workspaceId**

In `handleAdd`, pass workspaceId when creating:

```typescript
const created = await socialApi.create({
  workspaceId: activeWorkspaceId!,
  platform: form.platform,
  // ...rest
});
```

- [ ] **Step 5: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/app/dashboard/connections/ apps/web/lib/api.ts && git commit -m "feat(connections): workspace-scoped social account loading and OAuth initiation"
```

---

## Task 11: Clean Up — Delete Team Module

**Files:**
- Delete: `apps/api/src/team/`

- [ ] **Step 1: Verify TeamModule is no longer imported anywhere**

```bash
grep -r "TeamModule\|team.module\|team.service\|team.controller" /home/ubuntu/1P2P-main/apps/api/src/ --include="*.ts" | grep -v "workspace"
```

Expected: no output.

- [ ] **Step 2: Delete the team directory**

```bash
rm -rf /home/ubuntu/1P2P-main/apps/api/src/team/
```

- [ ] **Step 3: Run full test suite to verify no regressions**

```bash
cd /home/ubuntu/1P2P-main/apps/api && npx jest --no-coverage 2>&1 | tail -30
```

Expected: 86+ tests passing (same as Phase 12 baseline).

- [ ] **Step 4: Final compile check**

```bash
cd /home/ubuntu/1P2P-main/apps/api && npx tsc --noEmit 2>&1 | head -20
```

Expected: clean.

- [ ] **Step 5: Final commit**

```bash
cd /home/ubuntu/1P2P-main && git add -A && git commit -m "chore: remove Team module (replaced by Workspace), all tests passing"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Workspace model replaces Team (Task 1)
- [x] WorkspaceRole has OWNER/ADMIN/SUPERVISOR/MEMBER (Task 1)
- [x] SocialAccount belongs to Workspace (Tasks 1, 5, 6)
- [x] Users can be in multiple workspaces (Task 2 service + Task 8 page)
- [x] Workspace switcher in sidebar (Task 9)
- [x] OAuth flows carry workspaceId (Task 6)
- [x] THREADS/TELEGRAM added to Platform enum (Task 1 — used by Plan B)
- [x] onboardingCompletedAt/userRole added to User (Task 1 — used by Plan B)

**Missing pieces (addressed in Plan B):**
- Platform connection UI (onboarding grid)
- New platform services (Facebook, Threads, YouTube, Telegram, TikTok)
- Onboarding wizard flow
