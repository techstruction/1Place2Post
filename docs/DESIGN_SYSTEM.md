# 1Place2Post — Design System

> Canonical token and component spec for Phase 10 implementation.
> Reference this before touching any UI file.

---

## Color Tokens

### Brand / Accent
| Token | Value | Usage |
|---|---|---|
| `--brand-500` | `#4F6EF7` | Primary CTA, active states, links |
| `--brand-400` | `#7089F9` | Hover states |
| `--brand-600` | `#3A56E8` | Pressed states |
| `--brand-muted` | `rgba(79, 110, 247, 0.15)` | Subtle highlights, selected rows |

### Backgrounds
| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#0a0a0f` | Page background |
| `--bg-card` | `#13131a` | Cards, panels |
| `--bg-input` | `#1c1c26` | Input fields, dropdowns |
| `--bg-sidebar` | `#181B20` | Sidebar background |
| `--bg-hover` | `#1e1e2a` | Row hover, menu item hover |

### Text
| Token | Value | Usage |
|---|---|---|
| `--text-primary` | `#f0f0ff` | Primary content |
| `--text-secondary` | `#8888aa` | Labels, placeholders, metadata |
| `--text-dim` | `#555577` | Disabled states, very secondary |

### Borders
| Token | Value | Usage |
|---|---|---|
| `--border-default` | `#2a2a3a` | Default borders |
| `--border-subtle` | `#1e1e2e` | Very subtle dividers |

### Semantic
| Token | Value | Usage |
|---|---|---|
| `--success` | `#00d68f` | Published, connected, healthy |
| `--warning` | `#ffaa00` | Pending, expiring soon, amber alerts |
| `--danger` | `#ff4d6d` | Errors, disconnected, critical |
| `--info` | `#4F6EF7` | Informational (shares brand-500) |

### Legacy Tokens to REMOVE in Phase 10
- `--accent: #7c5cfc` (purple) — replace with `--brand-500`
- `--accent-hover: #9b80ff` — replace with `--brand-400`
- `--accent-muted` — replace with `--brand-muted`
- Lora font import — remove (unused)
- Poppins font import — remove (unused)

---

## Typography

### Fonts
```css
/* In globals.css — replace existing font imports */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');

--font-ui: 'Inter', -apple-system, sans-serif;
--font-display: 'Plus Jakarta Sans', sans-serif;
```

### Type Scale
| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `--text-xs` | 11px | 16px | 400 | Timestamps, metadata |
| `--text-sm` | 13px | 20px | 400 | Body, table cells (default) |
| `--text-base` | 14px | 22px | 400 | Secondary headings, labels |
| `--text-md` | 16px | 24px | 500 | Section titles |
| `--text-lg` | 20px | 28px | 600 | Page titles (Inter) |
| `--text-xl` | 28px | 36px | 700 | Hero/display (Plus Jakarta Sans) |

**Base font size:** 13px — compact, power-user density matching Publer's information density.

---

## Spacing & Layout

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Micro gaps |
| `--space-2` | 8px | Tight gaps |
| `--space-3` | 12px | Default gaps |
| `--space-4` | 16px | Standard padding |
| `--space-6` | 24px | Section spacing |
| `--space-8` | 32px | Large section spacing |

**Sidebar width:** 220px fixed (collapsed: 64px icon-only mode)
**Main content:** `margin-left: 220px`, expands to full on collapse
**Card radius:** 10px
**Input radius:** 8px
**Button radius:** 8px

---

## Tailwind Config

Create `apps/web/tailwind.config.ts`:

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
        },
        sidebar: '#181B20',
        surface: {
          base: '#0a0a0f',
          card: '#13131a',
          input: '#1c1c26',
          hover: '#1e1e2a',
        },
        border: {
          default: '#2a2a3a',
          subtle: '#1e1e2e',
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

---

## shadcn/ui Setup

Initialize from `apps/web/`:

```bash
cd apps/web
npx shadcn@latest init
```

`components.json` configuration:
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

### Required shadcn/ui Components (install in Phase 10)
```bash
npx shadcn@latest add button input label textarea select
npx shadcn@latest add dialog sheet dropdown-menu popover
npx shadcn@latest add card badge separator skeleton
npx shadcn@latest add table tabs progress toast
npx shadcn@latest add avatar tooltip command
```

### Custom Components (build on top of shadcn/ui)
| Component | Location | Purpose |
|---|---|---|
| `AccountHealthDot` | `components/AccountHealthDot.tsx` | Green/amber/red connection status dot |
| `PlatformBadge` | `components/PlatformBadge.tsx` | Instagram/TikTok/etc badge with icon |
| `PostStatusBadge` | `components/PostStatusBadge.tsx` | Draft/Scheduled/Published/Failed badges |
| `SentimentBadge` | `components/SentimentBadge.tsx` | Positive/neutral/negative inbox sentiment |
| `PublishFailureBanner` | `components/PublishFailureBanner.tsx` | Global alert when posts have failed |
| `SkeletonCard` | `components/SkeletonCard.tsx` | Loading placeholder for card grids |
| `PostPreviewPane` | `components/PostPreviewPane.tsx` | Side-by-side platform preview in composer |

---

## Navigation Icons

Replace all emoji navigation labels with Lucide icons.

```bash
cd apps/web && npm install lucide-react
```

| Section | Emoji (remove) | Lucide Icon (use) |
|---|---|---|
| Dashboard | 📊 | `LayoutDashboard` |
| Posts | 📝 | `FileText` |
| Calendar | 📅 | `Calendar` |
| Media | 🖼️ | `Image` |
| Templates | 📋 | `LayoutTemplate` |
| AI Studio | 🤖 | `Sparkles` |
| Publish Queue | 📤 | `Send` |
| RSS Campaigns | 📡 | `Rss` |
| Inbox | 💬 | `MessageSquare` |
| Leads | 👥 | `Users` |
| Notifications | 🔔 | `Bell` |
| Approvals | ✅ | `CheckSquare` |
| Connections | 🔗 | `Link` |
| Link Pages | 🌐 | `Globe` |
| Bot Rules | 🤖 | `Bot` |
| Team | 👥 | `UserCog` |
| Webhooks | ⚡ | `Zap` |
| Support | 🎫 | `LifeBuoy` |
| Subscription | 💳 | `CreditCard` |
| Docs | 📖 | `BookOpen` |
| Admin | ⚙️ | `ShieldCheck` |

---

## Sidebar Account Health Indicators

Render below the main navigation in the sidebar. Shows connected account status at a glance.

```
[ Instagram ] @brand_handle  ●  (green = healthy)
[ Facebook ]  @brand_page    ●  (amber = expiring < 7 days)
[ Twitter ]   @brand_twitter ●  (red = disconnected / expired)
```

**Data source:** `GET /api/social-accounts` — check `tokenExpiresAt` and `isActive` fields.

**Behavior:**
- Green dot: token valid, last synced < 24h
- Amber dot: token expires within 7 days → tooltip: "Token expires in 3 days — reconnect"
- Red dot: token expired or `isActive: false` → tooltip: "Account disconnected — reconnect"
- Click → navigates to `/dashboard/connections`

---

## Failure Surfacing Pattern

```tsx
// GlobalFailureBanner — rendered in root layout above main content
// Show when: any PostPublishJob has status FAILED and isAcknowledged: false
// Content: "⚠ 3 posts failed to publish — View details"
// Link: /dashboard/publish-queue?filter=failed
// Dismiss: sets isAcknowledged: true on all failed jobs (or per-job dismiss)
// Color: var(--danger) background, white text
```

---

## 3-Panel Inbox Layout

```
┌─────────────────┬──────────────────────────┬────────────────────────────────┐
│ Accounts        │ Threads                   │ Thread View                    │
│ 120px           │ 280px                     │ flex-1                         │
├─────────────────┼──────────────────────────┼────────────────────────────────┤
│ All (24)        │ [+] @user1 • 2h           │ @user1 commented on "Post A"   │
│ Instagram (12)  │   "Love this post!"       │                                │
│ Facebook (8)    │                           │ [thread messages scrollable]   │
│ Twitter (4)     │ [-] @user2 • 3h           │                                │
│                 │   "Where is my order???"  │ ─────────────────────────────  │
│                 │                           │ [reply textarea]               │
│                 │                           │ [Send] [Save Draft]            │
└─────────────────┴──────────────────────────┴────────────────────────────────┘
```

Sentiment badges: `+` positive, `-` negative, `?` neutral (derived from message content).

---

## Post Composer Preview Pane

Two-column layout within the composer page:

```
┌────────────────────────────┬──────────────────────────────┐
│ Compose (left)             │ Preview (right)               │
│                            │                               │
│ Platform checkboxes        │ Tab bar: [Instagram] [FB] ... │
│ Caption textarea           │                               │
│ Media upload zone          │ Platform-specific mock UI     │
│ Schedule datetime picker   │                               │
│ Hashtag suggestions        │ Character count: 142 / 2,200  │
│                            │ ⚠ TikTok limit: 150 chars    │
└────────────────────────────┴──────────────────────────────┘
```

Character limits by platform:
- Instagram caption: 2,200
- Twitter/X: 280
- Facebook: 63,206 (effectively unlimited)
- LinkedIn: 3,000
- TikTok: 2,200

---

## Loading States

Replace all `"Loading..."` text with shadcn/ui `<Skeleton>` components.

**Pattern:**
```tsx
// Before data loads:
<SkeletonCard />  // shows pulsing placeholder matching card dimensions

// After data loads:
<PostCard post={post} />
```

Use `Skeleton` from shadcn/ui for inline elements (table cells, stats, avatars).
