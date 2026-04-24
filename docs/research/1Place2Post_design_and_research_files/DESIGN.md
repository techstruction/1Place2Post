# 1Place2Post — Design System & UX Framework
> **For Claude Code**: This document is the single source of truth for all UI/UX decisions. Every screen, component, and interaction should reference and adhere to this specification. Do not deviate from these foundations without explicit instruction.

---

## 0. Design Philosophy

1Place2Post is built on a core belief: **professional social media management should feel effortless, not overwhelming.** The design takes deliberate inspiration from Publer's UX strengths — clean left-sidebar navigation, high information density without clutter, a calm neutral palette, and frictionless task flows — and elevates it by adding the richer feature set (unified inbox, bot rules, CRM leads, AI studio) that Publer deliberately never built.

**The Three Design Mandates:**
- **Clarity first.** Every screen should communicate what the user is doing, what has happened, and what they can do next — without them having to think about it.
- **Feature depth should not mean complexity.** 1Place2Post has more features than Publer. That must never feel like more work. Use progressive disclosure: show the most common action immediately, hide advanced controls one click away.
- **Trust is a design output.** The biggest complaint against every competitor (Content360, SocialBee, Metricool) is that posts silently fail, billing surprises people, and dashboards hide bad news. 1Place2Post should proactively surface status, failures, and anomalies — not hide them.

---

## 1. Visual Identity

### 1.1 Color Palette

The palette is a refined, professional neutral with a single vivid accent. It works in both light and dark modes.

```css
:root {
  /* Brand accent — use for CTAs, active states, key highlights ONLY */
  --brand-500:      #4F6EF7;   /* Primary blue — rich, confident, not generic */
  --brand-400:      #7089F9;   /* Hover state */
  --brand-600:      #3A56E8;   /* Active/pressed state */
  --brand-100:      #EEF1FE;   /* Tinted backgrounds, badges */
  --brand-50:       #F6F7FF;   /* Subtle page tints */

  /* Neutrals — the backbone of the entire UI */
  --gray-950:       #0D0F12;   /* Darkest text */
  --gray-900:       #181B20;   /* Sidebar background (light mode: inverted) */
  --gray-800:       #262B33;   /* Secondary sidebar elements */
  --gray-700:       #3A4150;   /* Muted text, disabled states */
  --gray-600:       #545E6F;   /* Secondary text */
  --gray-500:       #6E7A8A;   /* Placeholder text, icons */
  --gray-400:       #9AA3AE;   /* Borders (light), dividers */
  --gray-300:       #C4CAD2;   /* Borders (default) */
  --gray-200:       #E2E5EA;   /* Card borders, input borders */
  --gray-150:       #ECEEF2;   /* Hover backgrounds */
  --gray-100:       #F3F5F8;   /* Surface backgrounds, cards */
  --gray-50:        #F8F9FB;   /* Page background */
  --white:          #FFFFFF;

  /* Semantic colors */
  --success-500:    #16A34A;
  --success-100:    #DCFCE7;
  --success-600:    #15803D;

  --warning-500:    #D97706;
  --warning-100:    #FEF3C7;
  --warning-600:    #B45309;

  --danger-500:     #DC2626;
  --danger-100:     #FEE2E2;
  --danger-600:     #B91C1C;

  --info-500:       #0284C7;
  --info-100:       #E0F2FE;
  --info-600:       #0369A1;

  /* Platform brand colors — used ONLY in platform badges/icons */
  --platform-instagram: #E1306C;
  --platform-twitter:   #1DA1F2;
  --platform-linkedin:  #0077B5;
  --platform-facebook:  #1877F2;
  --platform-tiktok:    #010101;
  --platform-youtube:   #FF0000;
  --platform-threads:   #101010;
  --platform-bluesky:   #0085FF;
  --platform-pinterest: #E60023;
  --platform-mastodon:  #6364FF;
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --page-bg:       #0D0F12;
    --surface-1:     #181B20;   /* Card backgrounds */
    --surface-2:     #1F2430;   /* Nested surfaces */
    --border-default: #2A303C;
    --text-primary:  #F0F2F5;
    --text-secondary: #8B95A5;
    --text-muted:    #525D6E;
  }
}
```

### 1.2 Typography

```css
/* Import in <head> */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');

:root {
  /* Type stack */
  --font-ui:       'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-display:  'Plus Jakarta Sans', var(--font-ui);

  /* Scale */
  --text-xs:    11px;   /* Badges, timestamps, meta info */
  --text-sm:    12px;   /* Secondary labels, captions */
  --text-base:  13px;   /* Default UI text — slightly compact, like Publer */
  --text-md:    14px;   /* Body, descriptions */
  --text-lg:    16px;   /* Section headings, card titles */
  --text-xl:    18px;   /* Page headings */
  --text-2xl:   22px;   /* Dashboard hero numbers */
  --text-3xl:   28px;   /* Marketing/onboarding headings */

  /* Weights */
  --weight-normal:   400;
  --weight-medium:   500;
  --weight-semibold: 600;

  /* Line heights */
  --leading-tight:   1.25;
  --leading-normal:  1.5;
  --leading-relaxed: 1.65;
}
```

**Typography Rules:**
- Use `--font-display` (Plus Jakarta Sans) for page titles, dashboard numbers, and marketing copy only.
- Use `--font-ui` (Inter) for everything else — nav items, labels, inputs, table content, body text.
- Default font size is 13px (`--text-base`). This follows Publer's compact density preference — it packs more information without feeling cramped.
- Never set font-size below 11px anywhere in the application.

### 1.3 Spacing System

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### 1.4 Border Radius

```css
:root {
  --radius-sm:   4px;   /* Badges, chips, tiny elements */
  --radius-md:   6px;   /* Buttons, inputs, small cards */
  --radius-lg:   8px;   /* Cards, dropdowns, modals (most common) */
  --radius-xl:   12px;  /* Large modals, feature panels */
  --radius-2xl:  16px;  /* Sheet drawers, large overlays */
  --radius-full: 9999px; /* Pills, avatar circles */
}
```

### 1.5 Shadows

```css
:root {
  --shadow-xs:  0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:  0 4px 6px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04);
  --shadow-lg:  0 10px 15px rgba(0,0,0,0.07), 0 4px 6px rgba(0,0,0,0.04);
  --shadow-xl:  0 20px 25px rgba(0,0,0,0.08), 0 10px 10px rgba(0,0,0,0.04);
  --shadow-focus: 0 0 0 3px rgba(79,110,247,0.20); /* Brand focus ring */
}
```

---

## 2. Layout Architecture

### 2.1 The Shell

The application shell is a fixed two-column layout: a narrow left sidebar + full-height main content area. This is the Publer pattern — proven, familiar, efficient.

```
┌──────────────────────────────────────────────────────┐
│  SIDEBAR (220px fixed)  │  MAIN CONTENT (flex-1)     │
│  ┌──────────────────┐   │  ┌──────────────────────┐  │
│  │  Logo / Workspace│   │  │  Page Header         │  │
│  │  picker          │   │  │  (breadcrumb + CTAs) │  │
│  ├──────────────────┤   │  ├──────────────────────┤  │
│  │  Nav items       │   │  │                      │  │
│  │  (grouped)       │   │  │  Page Content        │  │
│  │                  │   │  │                      │  │
│  ├──────────────────┤   │  │                      │  │
│  │  Account health  │   │  │                      │  │
│  │  (connected accts│   │  └──────────────────────┘  │
│  ├──────────────────┤   │                            │
│  │  User avatar +   │   │                            │
│  │  settings        │   │                            │
│  └──────────────────┘   │                            │
└──────────────────────────────────────────────────────┘
```

**Sidebar specs:**
- Width: 220px (collapsible to 56px icon-only mode on mobile or user toggle)
- Background: `--gray-900` (dark sidebar, even in light mode — mirrors Publer's approach, creates clear visual separation)
- Position: `fixed`, full viewport height
- Z-index: 200

**Main content:**
- Left margin: 220px (matches sidebar)
- Background: `--gray-50`
- Padding: 24px top, 32px left/right
- Max content width: 1200px (centered within the main area)

### 2.2 Sidebar Structure

```
SIDEBAR
│
├── [Top section]
│   ├── Logo (1Place2Post wordmark — white on dark)
│   └── Workspace/Team picker (dropdown)
│
├── [Primary nav — grouped with subtle section labels]
│   ├── CONTENT
│   │   ├── Dashboard         (grid icon)
│   │   ├── Posts             (calendar-edit icon)
│   │   ├── Calendar          (calendar icon)
│   │   ├── Media Library     (photo icon)
│   │   └── Templates         (layout-template icon)
│   │
│   ├── ENGAGE
│   │   ├── Inbox             (inbox icon) [+ unread badge]
│   │   ├── Bot Rules         (robot icon)
│   │   └── Leads / CRM       (users icon) [+ new leads badge]
│   │
│   ├── PUBLISH
│   │   ├── Publish Queue     (clock icon) [+ failed jobs badge]
│   │   ├── RSS Campaigns     (rss icon)
│   │   └── Approvals         (check-circle icon) [+ pending badge]
│   │
│   ├── ANALYZE
│   │   ├── Analytics         (bar-chart icon)
│   │   └── Link Pages        (link icon)
│   │
│   └── AUTOMATE
│       ├── AI Studio         (sparkles icon)
│       └── Webhooks          (webhook icon)
│
├── [Connections health]
│   └── Connected accounts — compact list showing platform icons
│       with green/amber/red dot per connection health
│       (amber = expiring soon, red = disconnected — proactive alert)
│
└── [Bottom section]
    ├── Notifications bell     [+ unread count]
    ├── Help & Docs link
    └── User avatar + name     (click → account settings)
```

**Sidebar nav item styling:**
```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: rgba(255,255,255,0.60);   /* Muted white by default */
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  margin: 1px 8px;
}
.nav-item:hover {
  background: rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.90);
}
.nav-item.active {
  background: rgba(79,110,247,0.20);  /* Brand tint */
  color: #FFFFFF;
}
.nav-item .icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.8;
}
.nav-item.active .icon {
  opacity: 1;
}
.nav-section-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
  padding: 16px 20px 4px;
}
```

**Badge (notification count) on nav items:**
```css
.nav-badge {
  margin-left: auto;
  background: var(--danger-500);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: var(--radius-full);
  min-width: 16px;
  text-align: center;
  line-height: 14px;
}
.nav-badge.warning {
  background: var(--warning-500);
}
.nav-badge.info {
  background: var(--brand-500);
}
```

### 2.3 Page Header Pattern

Every page has a consistent header at the top of the main content area:

```
┌────────────────────────────────────────────────────────────┐
│  [Page Title]  [Subtitle/breadcrumb]          [CTAs right] │
│  24px top spacing from content area                        │
└────────────────────────────────────────────────────────────┘
  ← 32px padding                                   ← 32px →
```

```css
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}
.page-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  color: var(--gray-950);
  line-height: var(--leading-tight);
}
.page-subtitle {
  font-size: var(--text-sm);
  color: var(--gray-500);
  margin-top: 2px;
}
```

---

## 3. Core Components

### 3.1 Buttons

```css
/* Base button */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-ui);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;
  line-height: 1;
}

/* Sizes */
.btn-sm  { padding: 6px 12px; font-size: var(--text-sm); }
.btn-md  { padding: 8px 16px; font-size: var(--text-base); }  /* Default */
.btn-lg  { padding: 10px 20px; font-size: var(--text-md); }

/* Variants */
.btn-primary {
  background: var(--brand-500);
  color: white;
  border-color: var(--brand-500);
}
.btn-primary:hover  { background: var(--brand-400); border-color: var(--brand-400); }
.btn-primary:active { background: var(--brand-600); transform: translateY(0.5px); }

.btn-secondary {
  background: white;
  color: var(--gray-700);
  border-color: var(--gray-300);
}
.btn-secondary:hover  { background: var(--gray-50); border-color: var(--gray-400); }
.btn-secondary:active { background: var(--gray-100); }

.btn-ghost {
  background: transparent;
  color: var(--gray-600);
  border-color: transparent;
}
.btn-ghost:hover  { background: var(--gray-100); color: var(--gray-800); }

.btn-danger {
  background: var(--danger-500);
  color: white;
  border-color: var(--danger-500);
}
.btn-danger:hover { background: var(--danger-600); }

/* Icon-only button */
.btn-icon {
  padding: 7px;
  border-radius: var(--radius-md);
}

/* Focus state (all buttons) */
.btn:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}
```

### 3.2 Cards

The card is the primary content container throughout the app.

```css
.card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-xs);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--gray-100);
}
.card-title {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  color: var(--gray-900);
}
```

**Metric card (stat display — used heavily on Dashboard):**
```css
.metric-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.metric-card__label {
  font-size: var(--text-sm);
  color: var(--gray-500);
  font-weight: var(--weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.metric-card__value {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  color: var(--gray-900);
  line-height: 1;
}
.metric-card__trend {
  font-size: var(--text-sm);
  display: flex;
  align-items: center;
  gap: 3px;
}
.metric-card__trend.up   { color: var(--success-500); }
.metric-card__trend.down { color: var(--danger-500); }
```

### 3.3 Form Controls

```css
.input {
  width: 100%;
  padding: 8px 12px;
  font-family: var(--font-ui);
  font-size: var(--text-base);
  color: var(--gray-900);
  background: white;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  transition: border-color 0.12s, box-shadow 0.12s;
  outline: none;
}
.input::placeholder { color: var(--gray-400); }
.input:hover        { border-color: var(--gray-400); }
.input:focus        { border-color: var(--brand-500); box-shadow: var(--shadow-focus); }
.input.error        { border-color: var(--danger-500); }

.label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--gray-700);
  margin-bottom: var(--space-1);
}
.field-hint {
  font-size: var(--text-xs);
  color: var(--gray-500);
  margin-top: var(--space-1);
}
.field-error {
  font-size: var(--text-xs);
  color: var(--danger-500);
  margin-top: var(--space-1);
}

/* Select */
.select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236E7A8A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}
```

### 3.4 Badge / Status Chip

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  line-height: 16px;
  white-space: nowrap;
}

/* Post status badges */
.badge-draft     { background: var(--gray-100);    color: var(--gray-600); }
.badge-scheduled { background: var(--info-100);    color: var(--info-600); }
.badge-published { background: var(--success-100); color: var(--success-600); }
.badge-failed    { background: var(--danger-100);  color: var(--danger-600); }
.badge-pending   { background: var(--warning-100); color: var(--warning-600); }
.badge-approved  { background: var(--success-100); color: var(--success-600); }
.badge-rejected  { background: var(--danger-100);  color: var(--danger-600); }

/* Platform badges — use platform brand colors */
.platform-badge {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
```

### 3.5 Data Tables

Publer uses clean, minimal tables. 1Place2Post follows this pattern exactly — no zebra striping by default, just clean rows with subtle hover states.

```css
.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-base);
}
.table th {
  padding: 10px 16px;
  text-align: left;
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gray-500);
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
  white-space: nowrap;
}
.table td {
  padding: 12px 16px;
  color: var(--gray-700);
  border-bottom: 1px solid var(--gray-100);
  vertical-align: middle;
}
.table tr:last-child td { border-bottom: none; }
.table tbody tr:hover td { background: var(--gray-50); }
```

### 3.6 Tabs (in-page navigation)

```css
.tabs {
  display: flex;
  border-bottom: 1px solid var(--gray-200);
  gap: 0;
  margin-bottom: var(--space-6);
}
.tab {
  padding: 10px 16px;
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--gray-500);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  transition: color 0.12s, border-color 0.12s;
  white-space: nowrap;
}
.tab:hover  { color: var(--gray-800); }
.tab.active { color: var(--brand-500); border-bottom-color: var(--brand-500); }
```

### 3.7 Modals & Overlays

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  backdrop-filter: blur(2px);
}
.modal {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 560px;         /* Default modal */
  max-height: 90vh;
  overflow-y: auto;
  animation: modal-enter 0.15s ease;
}
.modal-lg  { max-width: 720px; }
.modal-xl  { max-width: 900px; }
.modal-header {
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--gray-100);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--gray-900);
}
.modal-body    { padding: var(--space-6); }
.modal-footer  {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--gray-100);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}
@keyframes modal-enter {
  from { opacity: 0; transform: translateY(-8px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

### 3.8 Toast Notifications

```css
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: var(--gray-900);
  color: white;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  box-shadow: var(--shadow-lg);
  pointer-events: all;
  min-width: 280px;
  max-width: 380px;
  animation: toast-in 0.2s ease;
}
.toast.success { background: var(--success-600); }
.toast.warning { background: var(--warning-600); }
.toast.error   { background: var(--danger-600); }
```

### 3.9 Empty States

Every list/table view needs a designed empty state — not a blank page.

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-8);
  text-align: center;
}
.empty-state__icon {
  width: 48px;
  height: 48px;
  color: var(--gray-300);
  margin-bottom: var(--space-4);
}
.empty-state__title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--gray-700);
  margin-bottom: var(--space-2);
}
.empty-state__description {
  font-size: var(--text-base);
  color: var(--gray-500);
  max-width: 360px;
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-5);
}
```

---

## 4. Page-by-Page Specifications

### 4.1 Dashboard (`/dashboard`)

**Purpose:** At-a-glance overview of account health, recent content, and key metrics. This is the first screen users see every day.

**Layout:**
```
[Metric cards row — 4 across]
  Published (30d) | Scheduled | Engagement Rate | Connected Accounts

[Two-column grid below]
  Left (65%): Recent posts timeline / calendar mini-view
  Right (35%): Account health + Upcoming queue

[Full-width bottom row]
  Engagement sparkline chart (30 days)
```

**Design details:**
- Metric cards use `--font-display` for the numbers. Make them big and readable.
- The "Connected Accounts" metric card shows a red number if any accounts are disconnected — this is the proactive trust signal that competitors miss. Clicking it goes directly to `/dashboard/connections`.
- The queue panel on the right shows the next 5 scheduled posts with time, platform icon, and title. Failed jobs appear at the top with a red `●` indicator.
- Account health section shows each connected account as a row: platform icon + account name + connection status dot + "expires in X days" if token is expiring soon.

**Key differentiator from competitors:** The dashboard proactively surfaces problems (disconnected accounts, failed jobs, expiring tokens) rather than waiting for users to notice. Design these alerts to be visible but calm — amber/red dot badges, not alarming full-width banners.

### 4.2 Posts List (`/dashboard/posts`)

**Purpose:** Browse, filter, and manage all posts across all platforms and statuses.

**Layout:**
```
[Page header: "Posts" + "New Post" button (primary, right-aligned)]
[Filter bar: Status tabs | Platform filter dropdown | Search input | Date range]
[Post list — card-style rows, NOT a plain table]
```

**Post list row design:**
```
┌──────────────────────────────────────────────────────────────────┐
│  [Platform icons]  [Post thumbnail/preview snippet]  [Status]   │
│  [Scheduled time or "Published X ago"]               [Actions ▾]│
└──────────────────────────────────────────────────────────────────┘
```
- Platform icons are stacked horizontally (overlap slightly if multiple) — 20px circles with platform color
- Post content preview: first 80 chars of caption + thumbnail if media present
- Status badge: `--badge-scheduled`, `--badge-published`, etc.
- Actions dropdown on hover: Edit / Duplicate / Delete / View Log
- The list is paginated, not infinite scroll — 25 posts per page
- Bulk selection: checkbox per row, bulk action bar appears at bottom when any are checked

**Status filter tabs:** All · Drafts · Scheduled · Published · Failed

**Key differentiation:** The "Failed" tab is a first-class filter — not something buried in a logs page. Clicking a failed post shows a clear error explanation and a one-click "Retry" button.

### 4.3 Post Composer (`/dashboard/posts/new` and `posts/[id]`)

This is the highest-traffic page in the app and deserves the most design polish. Publer's composer is excellent — clean, multi-panel, with per-platform preview.

**Layout (2-column):**
```
┌──────────────────────────┬─────────────────────┐
│  LEFT: COMPOSE           │  RIGHT: PREVIEW      │
│  ─────────────────────   │  ─────────────────── │
│  Platform selector row   │  Platform tabs       │
│  (icon toggles)          │  (Instagram preview  │
│                          │   Twitter preview    │
│  Content textarea        │   LinkedIn preview)  │
│  [character counter]     │                      │
│  [AI caption button]     │                      │
│                          │                      │
│  Media upload zone       │                      │
│  (drag & drop)           │                      │
│                          │                      │
│  Per-platform overrides  │                      │
│  (expandable panels)     │                      │
│                          │                      │
│  Schedule / Publish row  │                      │
│  ─────────────────────   │                      │
│  [Save Draft]  [Schedule]│                      │
│  or [Publish Now]        │                      │
│                          │                      │
│  ── Advanced ──          │                      │
│  Series | Template |     │                      │
│  Approval request        │                      │
└──────────────────────────┴─────────────────────┘
```

**Platform selector:**
- Row of platform icon buttons at the top of the composer
- Toggled on/off — active platforms have a colored ring matching their brand color
- Tooltip on hover shows "Instagram (2 accounts)" etc.
- When multiple accounts are connected per platform, clicking shows a sub-selector

**Content area:**
- Plain `<textarea>` with auto-resize — no rich text editor (matches Publer, keeps it fast)
- Character counter per platform shown below: "Instagram: 180/2200 · Twitter/X: 203/280 ✗"
- The counter turns amber at 90% and red at 100%+
- Hashtag/mention suggestions appear as inline chips

**AI Studio button:**
- A small "✨ AI Caption" button in the toolbar below the textarea
- Opens an inline panel (not a modal) with prompt input and generated options
- User selects from 3 generated captions — clicking inserts it

**Media upload:**
- Drag-and-drop zone with clear visual affordance
- Supports bulk upload — shows thumbnail grid
- Per-file: name, size, format badge, remove button
- Upload progress bar is always visible during upload
- Platform compatibility warnings appear inline: "Instagram Reels require 9:16 aspect ratio"

**Schedule row:**
- Datetime picker: clean, opens a calendar popup
- "Smart schedule" suggestion button: "Best time: Tue 7pm (based on your analytics)"
- Toggle: Schedule Now / Publish Immediately / Save Draft

**Approval request (expandable):**
- Collapsed by default — expand with "Request Approval" toggle
- Shows team member selector + optional note

### 4.4 Calendar (`/dashboard/calendar`)

**Purpose:** Monthly grid view of all scheduled content with drag-and-drop rescheduling.

**Layout:**
```
[Month navigation: ← April 2026 →]    [View: Month | Week | Day]   [+ New Post]
[Platform filter row: All | IG | X | LI | ... icon toggles]
[Grid calendar — full width]
  Each day cell shows:
  - Date number
  - Up to 3 post previews (platform icon + truncated title)
  - "+N more" chip if overflow
```

**Post event in calendar:**
- Colored left border matching primary platform
- Platform icon(s) + truncated caption
- Time shown as "2:30pm"
- Click opens post detail drawer (right-side panel) — no full-page nav

**Design notes:**
- Failed posts show with a red left border
- Drag handles on hover for rescheduling
- Platform filter chips are icon-only (colored platform icons) — keeps the filter bar compact

### 4.5 Unified Inbox (`/dashboard/inbox`)

**This is a primary differentiator vs. Publer — treat it as a flagship feature.**

**Layout (3-panel):**
```
┌─────────────────┬──────────────────────┬──────────────────┐
│ FILTER PANEL    │ MESSAGE LIST         │ MESSAGE DETAIL   │
│ (200px)         │ (320px)              │ (flex-1)         │
│                 │                      │                  │
│ All messages    │ [Message row]        │ [Thread header]  │
│ Unread          │ IG · @username       │ Platform, acct   │
│ DMs             │ "Hey I love your..." │                  │
│ Comments        │ 2m ago · 🔴          │ [Message thread] │
│ Mentions        │                      │                  │
│ ─────────────── │ [Message row]        │ [Reply box]      │
│ Platforms:      │ TW · @handle         │ (with send btn)  │
│ ☑ Instagram     │ "Question about..."  │                  │
│ ☑ Twitter       │ 15m ago              │ [Convert to Lead]│
│ ☑ LinkedIn      │                      │ button           │
│ ☑ Facebook      │ ...                  │                  │
└─────────────────┴──────────────────────┴──────────────────┘
```

**Message row design:**
- Platform icon (colored) + account name
- Preview of message content (truncated)
- Timestamp + unread dot (blue)
- Read/unread toggle on hover

**Message detail panel:**
- Full conversation thread
- Reply textarea at bottom with send button
- "Convert to Lead" CTA — creates a CRM lead from this conversation
- Sentiment badge (from AI analysis): Positive / Neutral / Negative / Urgent — shown when available
- "Escalate to Support Ticket" button for Negative/Urgent sentiment

**Key design note:** The sentiment badge is subtle — small colored chip next to the message. It should feel like a helpful hint, not an alert. Users who don't use it will barely notice it; users who do find it invaluable.

### 4.6 Leads / CRM (`/dashboard/leads`)

**Purpose:** Kanban pipeline of leads generated from bot rules and inbox interactions.

**Layout:**
```
[Page header: "Leads" + "Add Lead" button + Filter bar]
[Kanban board — horizontal scroll]
  Columns: New | Contacted | Qualified | Converted | Closed
```

**Lead card (Kanban):**
```
┌──────────────────────────┐
│ @username                │
│ via Instagram DM         │ ← platform badge
│ "Asked about pricing..." │ ← conversation snippet
│ ─────────────────────    │
│ [IG icon] 2h ago   [···] │
└──────────────────────────┘
```

**Lead detail (click → side drawer):**
- Contact info: username, platform, first contact date
- Full conversation history
- Pipeline stage selector
- Notes textarea
- Tags input
- Link to original inbox thread

### 4.7 Bot Rules (`/dashboard/bot-rules`)

**Purpose:** Create and manage automation rules that trigger on incoming messages/comments.

**Layout:**
```
[Page header: "Bot Rules" + "New Rule" button]
[Status tabs: Active | Inactive | All]
[Rule list — card rows]
```

**Rule card row:**
```
┌──────────────────────────────────────────────────────────┐
│ [●Active]  "Pricing inquiry"                   [Edit] [···]│
│ CONTAINS "price" OR "cost" OR "how much"                  │
│ → Auto-reply + Create Lead                                │
│ Fired 34 times · Last: 2h ago · Cooldown: 1h             │
└──────────────────────────────────────────────────────────┘
```

**Rule composer (modal — "New Rule"):**
- Rule name input
- Match type: CONTAINS | REGEX | ANY
- Match keywords (tag input)
- Actions (multi-select):
  - Send auto-reply (shows reply text input)
  - Create CRM lead
  - Send webhook
  - Notify team member
- Cooldown period selector
- Platform scoping (which platforms this rule applies to)
- Account scoping (which connected accounts)
- Active/Inactive toggle

### 4.8 Analytics (`/dashboard/analytics`)

**Layout:**
```
[Date range picker: Last 7d | 30d | 90d | Custom]
[Platform filter: All | Instagram | Twitter | ...]
[Metric cards row: Impressions | Engagements | Clicks | Follower growth]
[Main chart: Engagement over time (line chart)]
[Two-column row:]
  Left: Top performing posts (mini list)
  Right: Best posting times heatmap
[Geographic breakdown (if data available)]
```

**Chart styling:**
- Use recharts or Chart.js
- Single-color area charts per platform (platform brand color with 20% opacity fill)
- Grid lines: `--gray-100`, very subtle
- Tooltip: white card with shadow — clean, not crowded
- Legend: icon + platform name + metric value

### 4.9 Publish Queue (`/dashboard/jobs`)

**Purpose:** Monitor publish jobs — critical for the "posts that actually post" promise.

**Layout:**
```
[Status tabs: All | Pending | Running | Failed | Completed]
[Job list — clean table]
  Columns: Post | Platform | Scheduled For | Status | Attempts | Actions
```

**Failed job row design:**
- Red left border on the row
- Status badge: "Failed" (red)
- Error message excerpt: "Instagram: Invalid media format" (italic, gray-500)
- Actions: Retry | View Error Log | Delete

**Key design note:** Failed jobs must be visually prominent. This is the main way 1Place2Post demonstrates superior reliability — by making failures visible and actionable, not hidden in logs.

### 4.10 AI Studio (`/dashboard/ai-studio`)

**Layout:**
```
[Two panels side by side]
Left: PROMPT BUILDER
  - Template selector (dropdown)
  - Brand voice settings
  - Topic/keywords input
  - Platform target
  - Tone selector (Professional | Casual | Witty | Inspiring)
  - [Generate] button

Right: GENERATED OUTPUT
  - 3 caption variants shown as cards
  - Each card: copy icon + "Use this" button + "Regenerate" icon
  - Character count per variant per platform
  - [Create Post with this] CTA → goes to composer
```

### 4.11 Link Pages (`/dashboard/link-pages`)

**Layout:**
```
[Page header: "Link Pages" + "New Page" button]
[Pages list — card grid (2-column)]
  Each card: Page title + slug + theme preview thumbnail + visit count + edit button

[Link Page Editor — opens in full-page view]
  Left: Editor (links, theme picker, layout)
  Right: Live preview (phone mockup frame)
```

### 4.12 Team (`/dashboard/team`)

**Layout:**
```
[Page header: "Team" + "Invite Member" button]
[Member list — table]
  Columns: Member | Role | Status | Last Active | Actions

[Below: Pending invitations table]
```

**Role badges:** Owner (purple) · Admin (blue) · Member (gray)

---

## 5. Interaction Patterns

### 5.1 Loading States

- **Skeleton screens** for all data-heavy views (post lists, analytics, inbox). Never show a spinner on a blank page.
- **Inline spinners** for actions like "Publish Now" — replace the button label with a spinner, don't disable and show a separate loader.
- **Optimistic UI** for status changes (mark as read, drag lead card, etc.) — update immediately, revert on error with toast.

```css
.skeleton {
  background: linear-gradient(90deg, var(--gray-100) 25%, var(--gray-150) 50%, var(--gray-100) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
```

### 5.2 Hover States

- Cards: subtle border darkening + very slight `translateY(-1px)` on interactive cards
- Nav items: see sidebar spec above
- Table rows: `--gray-50` background
- Buttons: see button spec above

### 5.3 Focus States

All interactive elements must have a visible focus ring using `--shadow-focus`. No `outline: none` without a replacement. This is both accessibility requirement and design consistency.

### 5.4 Transitions

```css
/* Standard transition for all hover/state changes */
--transition-fast: 0.10s ease;
--transition-base: 0.15s ease;
--transition-slow: 0.25s ease;
```

Never use transitions longer than 300ms for functional UI. Save longer animations for empty states, onboarding, and loading screens.

### 5.5 Contextual Menus (...)

Every list item, post row, and card should have a "..." (three-dot) action menu on hover. These are `<button>` elements with a `<ul>` dropdown that appears above/below based on available space.

```css
.action-menu {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-1) 0;
  min-width: 160px;
  z-index: 300;
}
.action-menu-item {
  padding: 8px 14px;
  font-size: var(--text-base);
  color: var(--gray-700);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.action-menu-item:hover      { background: var(--gray-50); }
.action-menu-item.destructive { color: var(--danger-500); }
.action-menu-item.destructive:hover { background: var(--danger-100); }
```

---

## 6. Iconography

Use **Lucide Icons** throughout (already likely in the Next.js stack, tree-shakeable, clean design):
- `npm install lucide-react`
- Standard icon size: 16px for inline/nav, 20px for standalone actions, 24px for empty states

Platform icons are SVG logos — not Lucide. Use a consistent library like `react-icons/si` for `SiInstagram`, `SiTwitter`, etc. Always display at exactly 16px or 20px.

---

## 7. Responsive Behavior

The app is primarily a desktop tool (as Publer is). Mobile is supported but secondary.

**Breakpoints:**
```css
--bp-sm:  640px;   /* Mobile → collapse sidebar to icon-only */
--bp-md:  768px;   /* Tablet → single column layouts */
--bp-lg:  1024px;  /* Desktop → full layout */
--bp-xl:  1280px;  /* Wide → expanded panels */
```

**Mobile behavior:**
- Sidebar: hidden by default, opens as a full overlay on hamburger tap
- Post composer: single column (no side-by-side preview)
- Calendar: switches to list/agenda view
- Inbox: shows list → message detail on tap (no 3-panel)
- Analytics: charts scroll horizontally

---

## 8. Dark Mode

The sidebar is always dark. The main content area respects `prefers-color-scheme`.

When dark mode is active on the main content:
- Backgrounds: `--page-bg: #0D0F12`, cards `--surface-1: #181B20`
- Text: `--text-primary: #F0F2F5`, secondary `#8B95A5`
- Borders: `#2A303C`
- Inputs/buttons: adjust accordingly

All components should use CSS custom properties (variables) so dark mode is a single `:root[data-theme="dark"]` override. Never hardcode colors.

---

## 9. Specific Design Wins vs. Publer

These are the deliberate improvements over Publer's UX that should be visible and marketed:

| Feature | Publer's approach | 1Place2Post improvement |
|---|---|---|
| Social Inbox | Business-tier only, basic | First-class feature, available at entry tier, 3-panel layout, sentiment badges |
| Post failure | Shows "Failed" status | Shows failed status + error message + 1-click retry prominently in queue |
| Account health | Manual — users discover disconnected accounts when posts fail | Proactive — sidebar shows amber/red dots on accounts, token expiry warnings |
| CRM | None | Full Kanban lead pipeline generated from inbox/bot interactions |
| Bot rules | None | Full CONTAINS/REGEX/ANY match engine with multi-action dispatch |
| Pricing transparency | Per-account adds up fast | Flat-rate team plans clearly shown in `/dashboard/subscription` |
| AI | Gated to Business | AI Studio available in all plans (within usage limits) |

---

## 10. Component Library: Quick Reference

All components live in `apps/web/src/components/ui/`:

| File | Components |
|---|---|
| `button.tsx` | `Button`, `IconButton` |
| `card.tsx` | `Card`, `CardHeader`, `MetricCard` |
| `badge.tsx` | `Badge`, `StatusBadge`, `PlatformBadge` |
| `input.tsx` | `Input`, `Select`, `Textarea`, `Label`, `FieldHint` |
| `modal.tsx` | `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter` |
| `table.tsx` | `Table`, `Th`, `Td`, `TableWrapper` |
| `tabs.tsx` | `Tabs`, `Tab` |
| `toast.tsx` | `Toast`, `useToast` |
| `skeleton.tsx` | `Skeleton`, `SkeletonText`, `SkeletonCard` |
| `empty-state.tsx` | `EmptyState` |
| `dropdown.tsx` | `Dropdown`, `DropdownItem` |
| `avatar.tsx` | `Avatar`, `PlatformAvatar` |
| `sidebar.tsx` | `Sidebar`, `NavItem`, `NavSection` |

---

## 11. Implementation Notes for Claude Code

1. **CSS approach:** Use CSS Modules (`.module.css`) per component with the variables defined in a global `styles/tokens.css`. Never use inline styles except for dynamic values (e.g. `style={{ width: `${pct}%` }}`).

2. **Component props:** Every component should accept a `className` prop for extension. Use `clsx` or `cn` (shadcn pattern) for conditional class merging.

3. **Accessibility:** All interactive elements need `aria-label` when the visible text is insufficient. Focus states must always be visible. Use semantic HTML (`<button>`, `<nav>`, `<main>`, `<aside>`).

4. **Icons:** Import individually from `lucide-react` — never import the whole library:
   ```tsx
   import { Calendar, Inbox, Users } from 'lucide-react';
   ```

5. **Animations:** Use `tailwindcss-animate` or plain CSS keyframes. Respect `prefers-reduced-motion`.

6. **The sidebar is a server component wrapper** with client-side active-state detection via `usePathname()`.

7. **Post status colors must match the badge system exactly** — do not invent new status colors.

8. **Every new page needs:** Page title in `<title>`, page header component, loading skeleton, and empty state.
