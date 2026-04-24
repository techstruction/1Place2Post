# Phase 10: Design System & UI Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate 1Place2Post from a custom CSS/emoji UI to a shadcn/ui component system with blue brand tokens, Lucide icons, a redesigned sidebar with account health indicators, a global publish failure banner, skeleton loading states, a rebuilt post composer with preview pane, and a 3-panel inbox layout.

**Architecture:** Incremental adoption — existing CSS classes remain functional while new design tokens extend them. New components are built with shadcn/ui. Emoji navigation is replaced wholesale in the sidebar. Largest rewrites (composer preview pane, 3-panel inbox) are self-contained page-level rebuilds. No pages are left broken at any task boundary.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, shadcn/ui, Radix UI (via shadcn), Lucide React, Inter + Plus Jakarta Sans (Google Fonts)

---

## File Map

**Created:**
- `apps/web/tailwind.config.ts` — Tailwind v4 content paths + theme extension
- `apps/web/components.json` — shadcn/ui configuration
- `apps/web/lib/utils.ts` — shadcn/ui `cn()` helper
- `apps/web/components/ui/` — shadcn/ui generated components (button, card, badge, skeleton, etc.)
- `apps/web/components/AccountHealthDot.tsx` — green/amber/red connection status indicator
- `apps/web/components/PlatformBadge.tsx` — per-platform icon badge (Instagram, TikTok, etc.)
- `apps/web/components/PostStatusBadge.tsx` — draft/scheduled/published/failed badge
- `apps/web/components/SentimentBadge.tsx` — positive/neutral/negative inbox sentiment badge
- `apps/web/components/SkeletonCard.tsx` — pulsing loading placeholder for card grids
- `apps/web/components/PublishFailureBanner.tsx` — global alert when posts have failed

**Modified:**
- `apps/web/package.json` — add lucide-react, clsx, tailwind-merge
- `apps/web/app/globals.css` — new design tokens, @theme block, font stack, backward-compat aliases
- `apps/web/app/layout.tsx` — font imports (add Plus Jakarta Sans, remove Lora/Poppins)
- `apps/web/app/dashboard/layout.tsx` — sidebar: Lucide icons, 220px width, account health dots, failure banner
- `apps/web/app/dashboard/page.tsx` — skeleton loading states, updated stat cards
- `apps/web/app/dashboard/posts/new/page.tsx` — two-column layout with preview pane
- `apps/web/app/dashboard/inbox/page.tsx` — 3-panel layout with sentiment badges
- `apps/web/app/login/page.tsx` — fix undefined CSS var references
- `apps/web/app/register/page.tsx` — fix undefined CSS var references
- `apps/web/app/admin/layout.tsx` — fix undefined CSS variables

---

## Task 1: Install Dependencies & Initialize shadcn/ui

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/components.json`
- Create: `apps/web/lib/utils.ts`
- Create: `apps/web/components/ui/` (generated)

- [ ] **Step 1: Install npm packages**

```bash
cd /home/ubuntu/1P2P-main/apps/web && npm install lucide-react clsx tailwind-merge
```

Expected: packages added to `package.json`, no errors.

- [ ] **Step 2: Create tailwind.config.ts**

Create `/home/ubuntu/1P2P-main/apps/web/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          400: '#7089F9',
          500: '#4F6EF7',
          600: '#3A56E8',
          muted: 'rgba(79, 110, 247, 0.15)',
        },
        sidebar: '#181B20',
        surface: {
          base: '#0a0a0f',
          card: '#13131a',
          input: '#1c1c26',
          hover: '#1e1e2a',
        },
      },
      fontFamily: {
        ui: ['Inter', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['13px', '20px'],
        base: ['14px', '22px'],
        md: ['16px', '24px'],
        lg: ['20px', '28px'],
        xl: ['28px', '36px'],
      },
      borderRadius: {
        card: '10px',
        input: '8px',
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 3: Create components.json**

Create `/home/ubuntu/1P2P-main/apps/web/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

- [ ] **Step 4: Create lib/utils.ts**

Create `/home/ubuntu/1P2P-main/apps/web/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Add shadcn/ui components via CLI**

```bash
cd /home/ubuntu/1P2P-main/apps/web && npx shadcn@latest add button input label textarea select dialog sheet dropdown-menu popover card badge separator skeleton table tabs progress avatar tooltip --yes 2>&1
```

Expected: `components/ui/` directory created with component files. If the CLI asks for confirmation on overwriting `globals.css`, type `y`. If it complains about Tailwind v4 config detection, it will still add the component files.

- [ ] **Step 6: If Step 5 fails (interactive prompt issue), use this fallback**

Install Radix UI packages manually, then copy components from the shadcn registry:

```bash
cd /home/ubuntu/1P2P-main/apps/web && npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-avatar class-variance-authority
```

Then add components one at a time with `--yes --overwrite`:

```bash
cd /home/ubuntu/1P2P-main/apps/web && npx shadcn@latest add skeleton --yes --overwrite && npx shadcn@latest add badge --yes --overwrite && npx shadcn@latest add card --yes --overwrite && npx shadcn@latest add button --yes --overwrite
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd /home/ubuntu/1P2P-main/apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing errors unrelated to the new files).

- [ ] **Step 8: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/package.json apps/web/package-lock.json apps/web/tailwind.config.ts apps/web/components.json apps/web/lib/utils.ts apps/web/components/ui/ && git commit -m "feat(web): install shadcn/ui, lucide-react, tailwind config for Phase 10"
```

---

## Task 2: Design Token Migration (globals.css + layout.tsx)

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/app/layout.tsx`

The goal: add the new design token names, keep old names as aliases, update fonts, update sidebar width to 220px, and set base font-size to 13px.

- [ ] **Step 1: Read the current globals.css to understand what exists**

```bash
cat /home/ubuntu/1P2P-main/apps/web/app/globals.css
```

Note all the existing CSS custom properties and classes before making changes.

- [ ] **Step 2: Replace the :root block and font section in globals.css**

Find and replace the entire `:root { ... }` block (lines 3–19 in current file) with the expanded token set:

```css
:root {
  /* ── Brand ── */
  --brand-500: #4F6EF7;
  --brand-400: #7089F9;
  --brand-600: #3A56E8;
  --brand-muted: rgba(79, 110, 247, 0.15);

  /* ── Backgrounds ── */
  --bg-base: #0a0a0f;
  --bg-card: #13131a;
  --bg-input: #1c1c26;
  --bg-sidebar: #181B20;
  --bg-hover: #1e1e2a;

  /* ── Text ── */
  --text-primary: #f0f0ff;
  --text-secondary: #8888aa;
  --text-dim: #555577;

  /* ── Borders ── */
  --border-default: #2a2a3a;
  --border-subtle: #1e1e2e;

  /* ── Semantic ── */
  --success: #00d68f;
  --warning: #ffaa00;
  --danger: #ff4d6d;

  /* ── Typography ── */
  --font-ui: 'Inter', -apple-system, sans-serif;
  --font-display: 'Plus Jakarta Sans', sans-serif;

  /* ── Spacing ── */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* ── Radius ── */
  --radius: 10px;
  --radius-sm: 8px;

  /* ── Shadow ── */
  --shadow: 0 4px 24px rgba(0, 0, 0, 0.4);

  /* ── Legacy aliases (backward compat — remove post Phase 10) ── */
  --bg: var(--bg-base);
  --border: var(--border-default);
  --accent: var(--brand-500);
  --accent-hover: var(--brand-400);
  --accent-muted: var(--brand-muted);
  --text: var(--text-primary);
  --text-muted: var(--text-secondary);
  --font: var(--font-ui);

  /* ── Fix previously undefined variables ── */
  --color-heading: var(--text-primary);
  --text-main: var(--text-primary);
  --bg-main: var(--bg-base);
  --bg-card-hover: var(--bg-hover);
  --primary: var(--brand-500);
  --color-danger: var(--danger);
}
```

- [ ] **Step 3: Update body font and html font-size in globals.css**

Find:
```css
html {
  font-size: 16px;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
```

Replace with:
```css
html {
  font-size: 13px;
}

body {
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-ui);
```

- [ ] **Step 4: Update sidebar width in globals.css**

Find:
```css
.sidebar {
  width: 240px;
```

Replace with:
```css
.sidebar {
  width: 220px;
```

Find the collapsed sidebar CSS (look for `width: 80px` inside `.sidebar.collapsed`):
```css
.sidebar.collapsed {
  width: 80px;
```

Replace with:
```css
.sidebar.collapsed {
  width: 64px;
```

Find the `.main-content` margin that matches the sidebar:
```css
.main-content {
  margin-left: 240px;
```

Replace with:
```css
.main-content {
  margin-left: 220px;
```

Find the expanded main content (when sidebar is collapsed):
```css
.main-content.expanded {
  margin-left: 80px;
```

Replace with:
```css
.main-content.expanded {
  margin-left: 64px;
```

- [ ] **Step 5: Update sidebar background color in globals.css**

Find the `.sidebar` background:
```css
  background: var(--bg-card);
```

Replace with:
```css
  background: var(--bg-sidebar);
```

- [ ] **Step 6: Update layout.tsx — replace font imports**

In `/home/ubuntu/1P2P-main/apps/web/app/layout.tsx`, replace:

```tsx
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
```

With:
```tsx
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
```

- [ ] **Step 7: Verify TypeScript compiles and build succeeds**

```bash
cd /home/ubuntu/1P2P-main/apps/web && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 8: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/app/globals.css apps/web/app/layout.tsx && git commit -m "feat(web): migrate design tokens to blue brand system, update fonts and sidebar width"
```

---

## Task 3: Custom Component Library

Build the 6 reusable components that the next tasks depend on.

**Files:**
- Create: `apps/web/components/AccountHealthDot.tsx`
- Create: `apps/web/components/PostStatusBadge.tsx`
- Create: `apps/web/components/PlatformBadge.tsx`
- Create: `apps/web/components/SentimentBadge.tsx`
- Create: `apps/web/components/SkeletonCard.tsx`
- Create: `apps/web/components/PublishFailureBanner.tsx`

- [ ] **Step 1: Create AccountHealthDot.tsx**

Create `/home/ubuntu/1P2P-main/apps/web/components/AccountHealthDot.tsx`:

```tsx
type HealthStatus = 'healthy' | 'expiring' | 'disconnected';

interface AccountHealthDotProps {
  status: HealthStatus;
  tooltip?: string;
}

const colorMap: Record<HealthStatus, string> = {
  healthy: 'var(--success)',
  expiring: 'var(--warning)',
  disconnected: 'var(--danger)',
};

export function AccountHealthDot({ status, tooltip }: AccountHealthDotProps) {
  return (
    <span
      title={tooltip}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: colorMap[status],
        flexShrink: 0,
      }}
    />
  );
}

export function getAccountHealth(account: {
  isActive: boolean;
  tokenExpiresAt: string | null;
}): { status: HealthStatus; tooltip: string } {
  if (!account.isActive) {
    return { status: 'disconnected', tooltip: 'Account disconnected — reconnect' };
  }
  if (account.tokenExpiresAt) {
    const daysLeft = Math.floor(
      (new Date(account.tokenExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft < 0) {
      return { status: 'disconnected', tooltip: 'Token expired — reconnect' };
    }
    if (daysLeft < 7) {
      return { status: 'expiring', tooltip: `Token expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — reconnect` };
    }
  }
  return { status: 'healthy', tooltip: 'Connected' };
}
```

- [ ] **Step 2: Create PostStatusBadge.tsx**

Create `/home/ubuntu/1P2P-main/apps/web/components/PostStatusBadge.tsx`:

```tsx
type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';

const styles: Record<PostStatus, { bg: string; color: string; label: string }> = {
  DRAFT: { bg: 'rgba(136, 136, 170, 0.15)', color: 'var(--text-secondary)', label: 'Draft' },
  SCHEDULED: { bg: 'rgba(255, 170, 0, 0.15)', color: 'var(--warning)', label: 'Scheduled' },
  PUBLISHED: { bg: 'rgba(0, 214, 143, 0.15)', color: 'var(--success)', label: 'Published' },
  FAILED: { bg: 'rgba(255, 77, 109, 0.15)', color: 'var(--danger)', label: 'Failed' },
};

export function PostStatusBadge({ status }: { status: string }) {
  const s = styles[status as PostStatus] ?? styles.DRAFT;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: '0.02em',
      backgroundColor: s.bg,
      color: s.color,
    }}>
      {s.label}
    </span>
  );
}
```

- [ ] **Step 3: Create PlatformBadge.tsx**

Create `/home/ubuntu/1P2P-main/apps/web/components/PlatformBadge.tsx`:

```tsx
import { Instagram, Facebook, Twitter, Linkedin, Youtube, Music2, Globe } from 'lucide-react';

const PLATFORMS: Record<string, { icon: React.ComponentType<{ size?: number; color?: string }>; color: string; label: string }> = {
  INSTAGRAM: { icon: Instagram, color: '#E1306C', label: 'Instagram' },
  FACEBOOK: { icon: Facebook, color: '#1877F2', label: 'Facebook' },
  TWITTER: { icon: Twitter, color: '#1DA1F2', label: 'Twitter/X' },
  LINKEDIN: { icon: Linkedin, color: '#0A66C2', label: 'LinkedIn' },
  YOUTUBE: { icon: Youtube, color: '#FF0000', label: 'YouTube' },
  TIKTOK: { icon: Music2, color: '#ff0050', label: 'TikTok' },
};

export function PlatformBadge({ platform }: { platform: string }) {
  const p = PLATFORMS[platform?.toUpperCase()] ?? { icon: Globe, color: 'var(--text-secondary)', label: platform };
  const Icon = p.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: p.color }} title={p.label}>
      <Icon size={14} color={p.color} />
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.label}</span>
    </span>
  );
}
```

- [ ] **Step 4: Create SentimentBadge.tsx**

Create `/home/ubuntu/1P2P-main/apps/web/components/SentimentBadge.tsx`:

```tsx
type Sentiment = 'positive' | 'neutral' | 'negative';

const NEGATIVE_SIGNALS = ['angry', 'hate', 'terrible', 'awful', 'scam', 'refund', 'broken', 'where is', 'never again', '???', '!!'];
const POSITIVE_SIGNALS = ['love', 'amazing', 'great', 'awesome', 'perfect', '❤', '😍', '🔥', '💯', 'best'];

export function detectSentiment(message: string): Sentiment {
  const lower = message.toLowerCase();
  if (NEGATIVE_SIGNALS.some(s => lower.includes(s))) return 'negative';
  if (POSITIVE_SIGNALS.some(s => lower.includes(s))) return 'positive';
  return 'neutral';
}

const styles: Record<Sentiment, { bg: string; color: string; label: string }> = {
  positive: { bg: 'rgba(0, 214, 143, 0.12)', color: 'var(--success)', label: '+' },
  neutral: { bg: 'rgba(136, 136, 170, 0.12)', color: 'var(--text-secondary)', label: '?' },
  negative: { bg: 'rgba(255, 77, 109, 0.12)', color: 'var(--danger)', label: '−' },
};

export function SentimentBadge({ message }: { message: string }) {
  const sentiment = detectSentiment(message);
  const s = styles[sentiment];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 18,
      height: 18,
      borderRadius: '50%',
      fontSize: 11,
      fontWeight: 700,
      backgroundColor: s.bg,
      color: s.color,
      flexShrink: 0,
    }} title={sentiment}>
      {s.label}
    </span>
  );
}
```

- [ ] **Step 5: Create SkeletonCard.tsx**

Create `/home/ubuntu/1P2P-main/apps/web/components/SkeletonCard.tsx`:

```tsx
export function SkeletonCard() {
  return (
    <div className="stat-card" style={{ animation: 'skeleton-pulse 1.5s ease-in-out infinite' }}>
      <div style={{
        height: 12, width: '60%', borderRadius: 6,
        backgroundColor: 'var(--bg-hover)', marginBottom: 12,
      }} />
      <div style={{
        height: 28, width: '40%', borderRadius: 6,
        backgroundColor: 'var(--bg-hover)',
      }} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr style={{ animation: 'skeleton-pulse 1.5s ease-in-out infinite' }}>
      <td><div style={{ height: 14, width: '80%', borderRadius: 4, backgroundColor: 'var(--bg-hover)' }} /></td>
      <td><div style={{ height: 20, width: 70, borderRadius: 6, backgroundColor: 'var(--bg-hover)' }} /></td>
      <td><div style={{ height: 14, width: '50%', borderRadius: 4, backgroundColor: 'var(--bg-hover)' }} /></td>
    </tr>
  );
}
```

Then add the keyframe animation to globals.css (append at the end of the file):

```css
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

- [ ] **Step 6: Create PublishFailureBanner.tsx**

Create `/home/ubuntu/1P2P-main/apps/web/components/PublishFailureBanner.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';

export function PublishFailureBanner() {
  const [failedCount, setFailedCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('1p2p_token');
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api'}/publish-jobs?status=FAILED&acknowledged=false`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : [])
      .then((jobs: unknown[]) => setFailedCount(jobs.length))
      .catch(() => {});
  }, []);

  if (dismissed || failedCount === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 20px',
      backgroundColor: 'rgba(255, 77, 109, 0.12)',
      borderBottom: '1px solid var(--danger)',
      color: 'var(--danger)',
      fontSize: 13,
      fontWeight: 500,
    }}>
      <AlertTriangle size={16} />
      <span>
        {failedCount} post{failedCount !== 1 ? 's' : ''} failed to publish —{' '}
        <Link href="/dashboard/jobs?filter=failed" style={{ color: 'var(--danger)', textDecoration: 'underline' }}>
          View details
        </Link>
      </span>
      <button
        onClick={() => setDismissed(true)}
        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 0 }}
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd /home/ubuntu/1P2P-main/apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in the new component files.

- [ ] **Step 8: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/components/ apps/web/app/globals.css && git commit -m "feat(web): add custom component library (health dots, badges, skeleton, failure banner)"
```

---

## Task 4: Sidebar Overhaul (Lucide Icons + Account Health)

**Files:**
- Modify: `apps/web/app/dashboard/layout.tsx`

Replace emoji navigation with Lucide icons, integrate PublishFailureBanner, and add account health dots below the nav.

- [ ] **Step 1: Read the current layout.tsx**

```bash
cat /home/ubuntu/1P2P-main/apps/web/app/dashboard/layout.tsx
```

- [ ] **Step 2: Replace dashboard/layout.tsx entirely**

Write `/home/ubuntu/1P2P-main/apps/web/app/dashboard/layout.tsx`:

```tsx
'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { clearToken } from '../../lib/api';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, FileText, Calendar, Image, LayoutTemplate,
  Sparkles, BarChart2, Send, Rss, MessageSquare, Users, Bell,
  CheckSquare, Link as LinkIcon, Globe, Bot, UserCog, CreditCard,
  LifeBuoy, BookOpen, ShieldCheck, LogOut, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import { AccountHealthDot, getAccountHealth } from '../../components/AccountHealthDot';
import { PublishFailureBanner } from '../../components/PublishFailureBanner';

type SocialAccount = {
  id: string;
  platform: string;
  handle: string | null;
  isActive: boolean;
  tokenExpiresAt: string | null;
};

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/posts', label: 'Posts', icon: FileText },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/media', label: 'Media', icon: Image },
  { href: '/dashboard/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/dashboard/ai-studio', label: 'AI Studio', icon: Sparkles },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/jobs', label: 'Publish Queue', icon: Send },
  { href: '/dashboard/inbox', label: 'Unified Inbox', icon: MessageSquare },
  { href: '/dashboard/leads', label: 'Leads Pipeline', icon: Users },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/approvals', label: 'Approvals', icon: CheckSquare },
  { href: '/dashboard/rss-campaigns', label: 'RSS Campaigns', icon: Rss },
  { href: '/dashboard/outgoing-webhooks', label: 'Webhooks', icon: Zap },
  { href: '/dashboard/connections', label: 'Connections', icon: LinkIcon },
  { href: '/dashboard/link-pages', label: 'Link Pages', icon: Globe },
  { href: '/dashboard/bot-rules', label: 'Bot Rules', icon: Bot },
  { href: '/dashboard/team', label: 'Team', icon: UserCog },
  { href: '/dashboard/subscription', label: 'Subscription', icon: CreditCard },
  { href: '/dashboard/support', label: 'Support', icon: LifeBuoy },
  { href: '/docs/user', label: 'Documentation', icon: BookOpen },
];

const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  TWITTER: 'Twitter/X',
  LINKEDIN: 'LinkedIn',
  TIKTOK: 'TikTok',
  YOUTUBE: 'YouTube',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);

  useEffect(() => {
    try {
      const token = localStorage.getItem('1p2p_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsAdmin(payload.role === 'ADMIN');
      }
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('1p2p_token');
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api'}/social-accounts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : [])
      .then(setAccounts)
      .catch(() => {});
  }, []);

  function logout() {
    clearToken();
    router.push('/login');
  }

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const allNavItems = [
    ...NAV_ITEMS,
    ...(isAdmin ? [{ href: '/admin', label: 'Admin Console', icon: ShieldCheck }] : []),
  ];

  return (
    <div className="layout">
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <span className="logo-icon" style={{ cursor: 'pointer', marginRight: isCollapsed ? 0 : 10 }}>1</span>
          {!isCollapsed && <><span className="logo-text">Place</span><span className="nav-item-label">2Post</span></>}
          {!isCollapsed && (
            <button className="sidebar-toggle-btn" onClick={() => setIsCollapsed(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 'auto' }}
              title="Collapse">
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button className="sidebar-toggle-btn" onClick={() => setIsCollapsed(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '1rem', alignSelf: 'center' }}
            title="Expand">
            <ChevronRight size={18} />
          </button>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {allNavItems.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item${isActive(href, exact) ? ' active' : ''}`}
              title={isCollapsed ? label : undefined}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span className="nav-item-label">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Account Health */}
        {accounts.length > 0 && !isCollapsed && (
          <div style={{
            borderTop: '1px solid var(--border-default)',
            paddingTop: 12,
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 2 }}>
              Connections
            </span>
            {accounts.slice(0, 5).map(account => {
              const { status, tooltip } = getAccountHealth(account);
              return (
                <Link key={account.id} href="/dashboard/connections"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none' }}
                  title={tooltip}>
                  <AccountHealthDot status={status} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {PLATFORM_LABELS[account.platform] ?? account.platform}
                    {account.handle && <span style={{ color: 'var(--text-dim)' }}> @{account.handle}</span>}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Logout */}
        <button id="logout-btn" onClick={logout} className="nav-item btn-ghost"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', marginTop: 8 }}
          title="Log out">
          <LogOut size={17} style={{ flexShrink: 0 }} />
          <span className="nav-item-label">Log out</span>
        </button>
      </aside>

      {/* Main content area with failure banner */}
      <div className={`main-content ${isCollapsed ? 'expanded' : ''}`} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: 0 }}>
        <PublishFailureBanner />
        <div style={{ flex: 1, padding: '2rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
```

Note: the `main-content` previously had `padding: 2rem` from the CSS class. Since we added a flex wrapper, verify the padding is still applied correctly. If pages look double-padded, remove the `padding: '2rem'` from the inner div and keep it on the `.main-content` CSS class.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /home/ubuntu/1P2P-main/apps/web && npx tsc --noEmit 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors in `dashboard/layout.tsx`.

- [ ] **Step 4: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/app/dashboard/layout.tsx && git commit -m "feat(web): overhaul sidebar with Lucide icons, account health dots, failure banner"
```

---

## Task 5: Dashboard Overview — Skeleton Loading

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx`

Replace the `"Loading…"` text with animated skeleton placeholders. Use the `SkeletonCard` and `SkeletonRow` components.

- [ ] **Step 1: Read the current dashboard/page.tsx**

```bash
cat /home/ubuntu/1P2P-main/apps/web/app/dashboard/page.tsx
```

- [ ] **Step 2: Replace dashboard/page.tsx**

Write `/home/ubuntu/1P2P-main/apps/web/app/dashboard/page.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '../../lib/api';
import { PostStatusBadge } from '../../components/PostStatusBadge';
import { SkeletonCard, SkeletonRow } from '../../components/SkeletonCard';

type Post = { id: string; caption: string; status: string; scheduledAt: string | null; createdAt: string; };

export default function DashboardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsApi.list()
      .then(setPosts)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const stats = {
    total: posts.length,
    scheduled: posts.filter(p => p.status === 'SCHEDULED').length,
    drafts: posts.filter(p => p.status === 'DRAFT').length,
    published: posts.filter(p => p.status === 'PUBLISHED').length,
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <Link href="/dashboard/posts/new" className="btn btn-primary" id="new-post-btn">+ New Post</Link>
      </div>

      <div className="card-grid">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-label">Total Posts</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Scheduled</div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.scheduled}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Drafts</div>
              <div className="stat-value" style={{ color: 'var(--text-secondary)' }}>{stats.drafts}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Published</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.published}</div>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Posts</h2>
          <Link href="/dashboard/posts" style={{ fontSize: '0.85rem' }}>View all →</Link>
        </div>

        {loading ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Caption</th><th>Status</th><th>Scheduled</th></tr></thead>
              <tbody>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </tbody>
            </table>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty">
            <h3>No posts yet</h3>
            <p>Create your first post to get started.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Caption</th><th>Status</th><th>Scheduled</th></tr></thead>
              <tbody>
                {posts.slice(0, 5).map(post => (
                  <tr key={post.id}>
                    <td style={{ maxWidth: 280 }}>
                      <Link href={`/dashboard/posts/${post.id}`}>
                        {post.caption.slice(0, 60)}{post.caption.length > 60 ? '…' : ''}
                      </Link>
                    </td>
                    <td><PostStatusBadge status={post.status} /></td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString() : '—'}
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

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /home/ubuntu/1P2P-main/apps/web && npx tsc --noEmit 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 4: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/app/dashboard/page.tsx && git commit -m "feat(web): replace loading text with skeleton cards in dashboard overview"
```

---

## Task 6: Post Composer — Two-Column Preview Pane

**Files:**
- Modify: `apps/web/app/dashboard/posts/new/page.tsx`

Rebuild the composer with a two-column layout: left side has the compose form, right side shows a live preview with per-platform character limits.

- [ ] **Step 1: Read the current new/page.tsx**

```bash
cat /home/ubuntu/1P2P-main/apps/web/app/dashboard/posts/new/page.tsx
```

- [ ] **Step 2: Replace posts/new/page.tsx**

Write `/home/ubuntu/1P2P-main/apps/web/app/dashboard/posts/new/page.tsx`:

```tsx
'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '../../../../lib/api';
import MediaSelectorModal from '../../../../components/MediaSelectorModal';

type MediaAsset = { id: string; urlPath: string; mimeType: string; originalName: string };
type Platform = 'INSTAGRAM' | 'TWITTER' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK';

const PLATFORM_LIMITS: Record<Platform, number> = {
  INSTAGRAM: 2200,
  TWITTER: 280,
  FACEBOOK: 63206,
  LINKEDIN: 3000,
  TIKTOK: 2200,
};

const PLATFORM_LABELS: Record<Platform, string> = {
  INSTAGRAM: 'Instagram',
  TWITTER: 'Twitter/X',
  FACEBOOK: 'Facebook',
  LINKEDIN: 'LinkedIn',
  TIKTOK: 'TikTok',
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:35763';

function PreviewPane({ caption, activeTab, onTabChange }: {
  caption: string;
  activeTab: Platform;
  onTabChange: (p: Platform) => void;
}) {
  const limit = PLATFORM_LIMITS[activeTab];
  const count = caption.length;
  const isOver = count > limit;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Platform tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {(Object.keys(PLATFORM_LIMITS) as Platform[]).map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onTabChange(p)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === p ? 'var(--brand-500)' : 'var(--bg-hover)',
              color: activeTab === p ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {PLATFORM_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Mock preview card */}
      <div style={{
        backgroundColor: 'var(--bg-hover)',
        borderRadius: 10,
        padding: 16,
        minHeight: 200,
        border: '1px solid var(--border-default)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--bg-input)' }} />
          <div>
            <div style={{ height: 10, width: 80, borderRadius: 4, backgroundColor: 'var(--bg-input)' }} />
            <div style={{ height: 8, width: 60, borderRadius: 4, backgroundColor: 'var(--bg-input)', marginTop: 4 }} />
          </div>
        </div>
        <p style={{
          fontSize: 13,
          color: caption ? 'var(--text-primary)' : 'var(--text-dim)',
          lineHeight: 1.6,
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {caption || 'Your caption will appear here…'}
        </p>
      </div>

      {/* Character count */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        fontSize: 12,
        color: isOver ? 'var(--danger)' : count > limit * 0.9 ? 'var(--warning)' : 'var(--text-secondary)',
        fontWeight: isOver ? 600 : 400,
      }}>
        {isOver && <span style={{ marginRight: 6 }}>⚠</span>}
        {count.toLocaleString()} / {limit.toLocaleString()} chars
        {isOver && <span style={{ marginLeft: 6 }}>({PLATFORM_LABELS[activeTab]} limit exceeded)</span>}
      </div>
    </div>
  );
}

function NewPostForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [caption, setCaption] = useState(params.get('caption') ?? '');
  const [hashtags, setHashtags] = useState(params.get('hashtags') ?? '');
  const [scheduledAt, setScheduledAt] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'SCHEDULED'>('DRAFT');
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<Platform>('INSTAGRAM');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await postsApi.create({
        caption,
        hashtags: hashtags.split(' ').map(h => h.trim()).filter(Boolean),
        scheduledAt: scheduledAt || undefined,
        status: scheduledAt ? 'SCHEDULED' : status,
        mediaAssetIds: mediaAssets.map(a => a.id),
      });
      router.push('/dashboard/posts');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
      {/* Left: Compose form */}
      <div className="card">
        {error && <div className="alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Media</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {mediaAssets.map(a => (
                <div key={a.id} style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', backgroundColor: 'var(--bg-input)' }}>
                  {a.mimeType.startsWith('image/') ? (
                    <img src={`${API_BASE}${a.urlPath}`} alt={a.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 20 }}>🎬</div>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-ghost"
                style={{ width: 72, height: 72, border: '2px dashed var(--border-default)' }}
                onClick={() => setShowMediaModal(true)}>+</button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="caption">Caption *</label>
            <textarea id="caption" className="form-input" value={caption}
              onChange={e => setCaption(e.target.value)} required
              placeholder="Write your post caption…"
              style={{ minHeight: 120, resize: 'vertical' }} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="hashtags">Hashtags (space-separated)</label>
            <input id="hashtags" type="text" className="form-input" value={hashtags}
              onChange={e => setHashtags(e.target.value)} placeholder="#socialmedia #content" />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="scheduled-at">Schedule for (optional)</label>
            <input id="scheduled-at" type="datetime-local" className="form-input" value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)} />
          </div>

          {!scheduledAt && (
            <div className="form-group">
              <label className="form-label" htmlFor="status">Status</label>
              <select id="status" className="form-input" value={status}
                onChange={e => setStatus(e.target.value as 'DRAFT' | 'SCHEDULED')}>
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button id="submit-post-btn" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : scheduledAt ? 'Schedule Post' : 'Save as Draft'}
            </button>
            <Link href="/dashboard/posts" className="btn btn-ghost">Cancel</Link>
          </div>
        </form>
        {showMediaModal && (
          <MediaSelectorModal
            onClose={() => setShowMediaModal(false)}
            onSelect={(assets) => { setMediaAssets(assets); setShowMediaModal(false); }}
          />
        )}
      </div>

      {/* Right: Preview pane */}
      <div className="card">
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Preview
        </h3>
        <PreviewPane caption={caption} activeTab={activePreviewTab} onTabChange={setActivePreviewTab} />
      </div>
    </div>
  );
}

export default function NewPostPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">New Post</h1>
        <Link href="/dashboard/posts" className="btn btn-ghost">← Back</Link>
      </div>
      <Suspense fallback={
        <div className="card" style={{ maxWidth: 680 }}>
          <p style={{ color: 'var(--text-dim)' }}>Loading…</p>
        </div>
      }>
        <NewPostForm />
      </Suspense>
    </>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /home/ubuntu/1P2P-main/apps/web && npx tsc --noEmit 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 4: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/app/dashboard/posts/new/page.tsx && git commit -m "feat(web): rebuild post composer with two-column preview pane and character counters"
```

---

## Task 7: Inbox — 3-Panel Layout

**Files:**
- Modify: `apps/web/app/dashboard/inbox/page.tsx`

Rebuild the inbox from a flat list into a 3-panel layout: accounts column | threads list | thread view with sentiment badges.

- [ ] **Step 1: Read the current inbox/page.tsx**

```bash
cat /home/ubuntu/1P2P-main/apps/web/app/dashboard/inbox/page.tsx
```

- [ ] **Step 2: Replace inbox/page.tsx**

Write `/home/ubuntu/1P2P-main/apps/web/app/dashboard/inbox/page.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { inboxApi } from '../../../lib/api';
import { SentimentBadge } from '../../../components/SentimentBadge';
import { PlatformBadge } from '../../../components/PlatformBadge';

type InboxMessage = {
  id: string;
  platform: string | null;
  kind: string;
  fromHandle: string | null;
  message: string;
  receivedAt: string;
  isRead: boolean;
};

const PLATFORMS = ['ALL', 'INSTAGRAM', 'FACEBOOK', 'TWITTER', 'LINKEDIN', 'TIKTOK'];

export default function InboxPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function loadData() {
    setError(null);
    const token = localStorage.getItem('1p2p_token');
    if (!token) { router.push('/login'); return; }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api'}/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setMessages(data);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleMarkRead(id: string) {
    try {
      await inboxApi.markRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    } catch { /* silent */ }
  }

  async function handleMarkAllRead() {
    try {
      await inboxApi.markAllRead();
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    } catch { /* silent */ }
  }

  const platformCounts = PLATFORMS.reduce<Record<string, number>>((acc, p) => {
    acc[p] = p === 'ALL'
      ? messages.length
      : messages.filter(m => m.platform === p).length;
    return acc;
  }, {});

  const filtered = selectedPlatform === 'ALL'
    ? messages
    : messages.filter(m => m.platform === selectedPlatform);

  const selected = messages.find(m => m.id === selectedId) ?? null;
  const unreadCount = messages.filter(m => !m.isRead).length;

  const panelStyle = {
    borderRight: '1px solid var(--border-default)',
    overflowY: 'auto' as const,
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">
          Unified Inbox
          {unreadCount > 0 && <span className="badge badge-brand" style={{ marginLeft: '0.8rem' }}>{unreadCount} new</span>}
        </h1>
        {unreadCount > 0 && (
          <button className="btn btn-ghost" onClick={handleMarkAllRead}>✓ Mark All as Read</button>
        )}
      </div>

      {error && (
        <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--danger)', marginBottom: '1rem' }}>
          <p style={{ color: 'var(--danger)', margin: 0 }}>⚠ {error}</p>
          <button className="btn btn-ghost" style={{ marginTop: '0.8rem', fontSize: '0.85rem' }} onClick={loadData}>Retry</button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: '120px 280px 1fr', height: 'calc(100vh - 220px)', minHeight: 400 }}>
        {/* Column 1: Platform filter */}
        <div style={{ ...panelStyle, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-dim)', textTransform: 'uppercase', padding: '0 8px', marginBottom: 4 }}>
            Accounts
          </span>
          {PLATFORMS.filter(p => p === 'ALL' || platformCounts[p] > 0).map(p => (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: selectedPlatform === p ? 600 : 400,
                backgroundColor: selectedPlatform === p ? 'var(--brand-muted)' : 'transparent',
                color: selectedPlatform === p ? 'var(--brand-500)' : 'var(--text-secondary)',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span>{p === 'ALL' ? 'All' : p.charAt(0) + p.slice(1).toLowerCase()}</span>
              <span style={{
                fontSize: 10,
                backgroundColor: selectedPlatform === p ? 'var(--brand-500)' : 'var(--bg-hover)',
                color: selectedPlatform === p ? '#fff' : 'var(--text-dim)',
                borderRadius: 10,
                padding: '1px 6px',
                minWidth: 20,
                textAlign: 'center',
              }}>
                {platformCounts[p]}
              </span>
            </button>
          ))}
        </div>

        {/* Column 2: Thread list */}
        <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ padding: 16, color: 'var(--text-dim)', fontSize: 13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, color: 'var(--text-dim)', fontSize: 13, textAlign: 'center' }}>No messages</div>
          ) : (
            filtered.map(msg => (
              <button
                key={msg.id}
                onClick={() => { setSelectedId(msg.id); if (!msg.isRead) handleMarkRead(msg.id); }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border-subtle)',
                  border: 'none',
                  borderBottomWidth: 1,
                  borderBottomStyle: 'solid',
                  borderBottomColor: 'var(--border-subtle)',
                  cursor: 'pointer',
                  backgroundColor: selectedId === msg.id
                    ? 'var(--brand-muted)'
                    : msg.isRead ? 'transparent' : 'rgba(79, 110, 247, 0.04)',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: msg.isRead ? 500 : 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.fromHandle ? `@${msg.fromHandle}` : 'Anonymous'}
                  </span>
                  <SentimentBadge message={msg.message} />
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {msg.message}
                </p>
                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                  {new Date(msg.receivedAt).toLocaleString()}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Column 3: Thread view */}
        <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {selected ? (
            <>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selected.fromHandle ? `@${selected.fromHandle}` : 'Anonymous'}
                  </div>
                  {selected.platform && (
                    <div style={{ marginTop: 4 }}>
                      <PlatformBadge platform={selected.platform} />
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  {new Date(selected.receivedAt).toLocaleString()}
                </span>
              </div>

              <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                <div style={{
                  backgroundColor: 'var(--bg-hover)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  maxWidth: 560,
                }}>
                  {selected.message}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}>
                  via {selected.kind}
                </div>
              </div>

              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-default)' }}>
                <textarea
                  placeholder="Write a reply…"
                  className="form-input"
                  style={{ width: '100%', minHeight: 80, resize: 'vertical', marginBottom: 10 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" style={{ fontSize: 13 }}>Send Reply</button>
                  <button className="btn btn-ghost" style={{ fontSize: 13 }}>Save Draft</button>
                </div>
                <p style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}>
                  Note: Reply sending requires platform API integration (Phase 11).
                </p>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
              Select a message to view
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /home/ubuntu/1P2P-main/apps/web && npx tsc --noEmit 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 4: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/app/dashboard/inbox/page.tsx && git commit -m "feat(web): rebuild inbox as 3-panel layout with sentiment badges and platform filter"
```

---

## Task 8: Auth & Admin Cleanup (Fix Undefined CSS Variables)

**Files:**
- Modify: `apps/web/app/login/page.tsx`
- Modify: `apps/web/app/register/page.tsx`
- Modify: `apps/web/app/admin/layout.tsx`

Fix all uses of undefined CSS variables (`--color-heading`, `--bg-main`, `--primary`, etc.). These are now defined in Task 2's `:root` block as aliases, so this task verifies the fixes hold and replaces any inline references with the correct token names.

- [ ] **Step 1: Search for undefined variable usage across all files**

```bash
grep -rn --include="*.tsx" --include="*.ts" "var(--color-heading\|var(--bg-main\|var(--text-main\|var(--bg-card-hover\|var(--primary)" /home/ubuntu/1P2P-main/apps/web/
```

Note every file and line with these references. They should all work now (aliases defined in Task 2), but we'll also update any we find to use the canonical names.

- [ ] **Step 2: Read admin/layout.tsx**

```bash
cat /home/ubuntu/1P2P-main/apps/web/app/admin/layout.tsx
```

- [ ] **Step 3: In admin/layout.tsx, replace all inline style CSS variable references**

Do a global find-and-replace in `apps/web/app/admin/layout.tsx`:

| Old | New |
|-----|-----|
| `var(--primary)` | `var(--brand-500)` |
| `var(--color-heading)` | `var(--text-primary)` |
| `var(--bg-main)` | `var(--bg-base)` |
| `var(--font-body)` | `var(--font-ui)` |
| `var(--text-dim)` | `var(--text-dim)` (no change, already correct) |

Read the file, make these substitutions throughout, and write it back.

- [ ] **Step 4: Verify no undefined variables remain in auth pages**

```bash
grep -n "var(--" /home/ubuntu/1P2P-main/apps/web/app/login/page.tsx /home/ubuntu/1P2P-main/apps/web/app/register/page.tsx
```

Any variable references found: verify they exist in the `:root` block we wrote in Task 2. If any don't match, fix them to use the correct token name.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /home/ubuntu/1P2P-main/apps/web && npx tsc --noEmit 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 6: Run a build to verify everything compiles**

```bash
cd /home/ubuntu/1P2P-main/apps/web && npm run build 2>&1 | tail -30
```

Expected: build succeeds. Note any warnings but they should not block.

- [ ] **Step 7: Commit**

```bash
cd /home/ubuntu/1P2P-main && git add apps/web/app/admin/ apps/web/app/login/page.tsx apps/web/app/register/page.tsx && git commit -m "fix(web): resolve undefined CSS variable references in admin and auth pages"
```

---

## Task 9: Production Build Verification

**Files:** No new files

Verify the full production build completes without errors and the running containers are up-to-date.

- [ ] **Step 1: Build the Next.js app**

```bash
cd /home/ubuntu/1P2P-main/apps/web && npm run build 2>&1
```

Expected: build completes. Route generation should show all dashboard pages.

Fix any TypeScript or build errors before proceeding.

- [ ] **Step 2: Rebuild the Docker containers**

```bash
cd /home/ubuntu/1P2P-main && docker compose -f deploy/docker-compose.prod.yml build 1p_web_prod 2>&1 | tail -20
```

Expected: build succeeds with the updated Next.js code.

- [ ] **Step 3: Restart the web container**

```bash
cd /home/ubuntu/1P2P-main && docker compose -f deploy/docker-compose.prod.yml up -d 1p_web_prod
```

Expected: container restarts with the new build.

- [ ] **Step 4: Verify containers are running**

```bash
docker ps | grep 1p_web_prod
```

Expected: container is `Up`.

- [ ] **Step 5: Smoke test key pages**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ && echo "" && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login && echo "" && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard && echo ""
```

Expected: HTTP 200 for `/` and `/login`; HTTP 307 redirect (to `/login`) for `/dashboard` (unauthenticated).

- [ ] **Step 6: Final commit with Phase 10 tag**

```bash
cd /home/ubuntu/1P2P-main && git add -A && git status
```

If any files remain uncommitted, add and commit them:

```bash
cd /home/ubuntu/1P2P-main && git commit -m "feat: Phase 10 complete — design system, shadcn/ui, Lucide nav, 3-panel inbox, composer preview"
```

---

## Self-Review Checklist

### Spec Coverage

| Phase 10 Requirement | Task |
|---|---|
| Adopt shadcn/ui (Tailwind v4 + Radix UI) | Task 1 |
| Migrate accent color to blue #4F6EF7 | Task 2 |
| Replace emoji nav with Lucide icons | Task 4 |
| Rebuild post composer with preview pane | Task 6 |
| Redesign inbox as 3-panel layout with sentiment badges | Task 7 |
| Add account health indicators to sidebar | Task 4 |
| Add global failure banner | Tasks 3 + 4 |
| Skeleton screens for all loading states | Tasks 3 + 5 |

All 8 requirements are covered.

### Known Gaps to Address in Phase 11

- Reply sending in inbox is stubbed (requires platform API integration)
- Only dashboard/page.tsx gets skeleton screens — other dashboard pages still show "Loading…" text. Apply the same pattern to `posts/page.tsx`, `calendar/page.tsx`, etc. as a quick follow-up.
- Admin layout cleanup in Task 8 is search-and-replace; agent should read file and apply changes carefully rather than guessing content.
- The `/api/publish-jobs` endpoint used by `PublishFailureBanner` must exist in the NestJS API. If the endpoint is `/api/jobs` instead, update the fetch URL in `PublishFailureBanner.tsx`.
- The `/api/social-accounts` endpoint used by the sidebar must exist. If missing, the account health section simply won't render (silent fail handled by `.catch(() => {})`).
