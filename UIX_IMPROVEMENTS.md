# UI/UX Improvement Tracker — Phase 10

> **Design system spec:** `docs/DESIGN_SYSTEM.md`
> **North Star:** `docs/NORTH_STAR.md`
> **Benchmark competitor:** Publer (not Content360 — see competitive research in `docs/research/`)
>
> This document tracks Phase 10 (Design System & UI Overhaul) and Phase 11 (Feature Completeness) work items.
> Visual indicators: ⚪ To Do · 🟡 In Progress · ✅ Completed

---

## Table of Contents

- [Global Design System (Phase 10)](#global-design-system-phase-10)
- [Overview / Dashboard](#overview--dashboard)
- [Posts](#posts)
- [Calendar](#calendar)
- [Media](#media)
- [Templates](#templates)
- [AI Studio](#ai-studio)
- [Analytics](#analytics)
- [Publish Queue](#publish-queue)
- [Unified Inbox](#unified-inbox)
- [Leads Pipeline](#leads-pipeline)
- [Notifications](#notifications)
- [Approvals](#approvals)
- [RSS Campaigns](#rss-campaigns)
- [Webhooks](#webhooks)
- [Connections](#connections)
- [Link Pages](#link-pages)
- [Bot Rules](#bot-rules)
- [Team](#team)
- [Subscription Plans](#subscription-plans)
- [Support](#support)
- [Documentation](#documentation)
- [Admin Console](#admin-console)
- [Interaction Test Log](#interaction-test-log)

---

## Global Design System (Phase 10)

*Foundation work that affects every page. Must complete before per-page improvements.*

**Publer benchmark:** Dark sidebar, blue accent, compact 13px density, Lucide icons, high information density without clutter.

### Component Library
- [ ] ⚪ Initialize shadcn/ui (`npx shadcn@latest init` from `apps/web/`)
- [ ] ⚪ Create `apps/web/tailwind.config.ts` with brand tokens (see `docs/DESIGN_SYSTEM.md`)
- [ ] ⚪ Install shadcn/ui base components: Button, Input, Label, Textarea, Select
- [ ] ⚪ Install shadcn/ui overlay components: Dialog, Sheet, DropdownMenu, Popover
- [ ] ⚪ Install shadcn/ui display components: Card, Badge, Separator, Skeleton, Table, Tabs, Toast
- [ ] ⚪ Install shadcn/ui utility components: Avatar, Tooltip, Command
- [ ] ⚪ Install `lucide-react` for icons

### Global Tokens
- [ ] ⚪ Update `globals.css`: replace `--accent: #7c5cfc` with `--brand-500: #4F6EF7`
- [ ] ⚪ Remove unused font imports: Lora, Poppins
- [ ] ⚪ Add Plus Jakarta Sans for display headings
- [ ] ⚪ Set base font-size to 13px

### Sidebar
- [ ] ⚪ Reduce sidebar width: 240px → 220px
- [ ] ⚪ Update sidebar background to `#181B20`
- [ ] ⚪ Replace all emoji nav icons with Lucide icons (see icon map in `docs/DESIGN_SYSTEM.md`)
- [ ] ⚪ Add account health dots below nav: green/amber/red for connection status
- [ ] ⚪ Amber dot: token expires within 7 days → tooltip "Token expires in X days — reconnect"
- [ ] ⚪ Red dot: disconnected or expired token → tooltip "Account disconnected — reconnect"

### Global Failure Banner
- [ ] ⚪ Build `PublishFailureBanner` component — shown in root layout when failed jobs exist
- [ ] ⚪ Content: "⚠ X posts failed to publish — View details" → links to publish queue (filtered: FAILED)
- [ ] ⚪ Dismiss clears acknowledgement on all or individual failed jobs

### Loading States
- [ ] ⚪ Replace all "Loading…" text with `<Skeleton>` components from shadcn/ui
- [ ] ⚪ Build `SkeletonCard` component for card grid loading states

### Typography
- [ ] ⚪ Apply Inter font family for all UI text (already imported — verify no overrides)
- [ ] ⚪ Apply Plus Jakarta Sans for page titles and display headings
- [ ] ⚪ Standardize text size usage to `--text-sm` (13px) as default body size

---

## Overview / Dashboard

*Main dashboard landing page at `/dashboard`.*

**Publer benchmark:** Stats bar at top (followers, scheduled, published today), quick-action buttons, upcoming scheduled posts list.

- [ ] ⚪ Add summary stat cards: Posts Scheduled, Posts Published (last 30 days), Connected Accounts
- [ ] ⚪ Add publish success rate stat (# published / # attempted, last 30 days)
- [ ] ⚪ Show upcoming scheduled posts (next 5, sorted by scheduledAt)
- [ ] ⚪ Quick-action button: "New Post" — persistent, prominent
- [ ] ⚪ Show failed post count with link to publish queue if > 0
- [ ] ⚪ Skeleton loading states for all stat cards
- **Status:** ⚪ To Do

---

## Posts

*Content creation and management at `/dashboard/posts`.*

**Publer benchmark:** Grid/list toggle, status filter tabs (All/Draft/Scheduled/Published/Failed), platform icons on each post card, inline status badge.

- [ ] ⚪ Grid view + list view toggle
- [ ] ⚪ Status filter tabs: All, Draft, Scheduled, Published, Failed
- [ ] ⚪ Failed post retry: clear error message + 1-click retry button on each failed post card
- [ ] ⚪ Platform badges on post cards (show which platforms each post targets)
- [ ] ⚪ Multi-select for bulk actions (Delete, Reschedule)
- [ ] ⚪ Bulk CSV import for scheduling many posts
- [ ] ⚪ Mobile platform preview: TikTok/Reels mock frame (vertical 9:16 ratio preview)
- [ ] ⚪ Skeleton loading states
- **Status:** ⚪ To Do

---

## Post Composer

*New/edit post form at `/dashboard/posts/new` and `/dashboard/posts/[id]`.*

**Publer benchmark:** Two-column layout — compose left, platform preview right. Character counter per platform. Platform selector as checkboxes with account names.

- [ ] ⚪ Two-column layout: compose (left) + live preview (right)
- [ ] ⚪ Platform preview tabs: switch between Instagram/Facebook/Twitter/etc mock
- [ ] ⚪ Per-platform character counter with limit enforcement and warnings
  - Instagram: 2,200 / Twitter: 280 / LinkedIn: 3,000 / TikTok: 2,200
- [ ] ⚪ Hashtag suggestion input (auto-complete from previously used tags)
- [ ] ⚪ Media upload zone with drag-and-drop (images and video)
- [ ] ⚪ Platform selector: checkboxes with platform icon + account @handle
- [ ] ⚪ Schedule datetime picker with timezone display
- [ ] ⚪ Save as Draft / Schedule / Publish Now buttons with clear hierarchy
- **Status:** ⚪ To Do

---

## Calendar

*Visual scheduling at `/dashboard/calendar`.*

**Publer benchmark:** Monthly grid, platform-color-coded dots on dates, click date to create post, hover to preview post summary.

- [ ] ⚪ Platform-colored dots on scheduled dates (each platform has a distinct color)
- [ ] ⚪ Drag-and-drop rescheduling (move post to different date)
- [ ] ⚪ Click empty date cell → opens post composer pre-filled with that date
- [ ] ⚪ Hover a post dot → popover showing post preview (caption truncated, platform icons)
- [ ] ⚪ Team calendar toggle: show all team members' posts or just yours
- **Status:** ⚪ To Do

---

## Media

*Asset management at `/dashboard/media`.*

**Publer benchmark:** Grid view, folder/tag organization, search, drag-and-drop upload zone.

- [ ] ⚪ Folder/category organization (create folders, move assets)
- [ ] ⚪ Drag-and-drop upload zone (multi-file, images and video)
- [ ] ⚪ Search assets by name or tag
- [ ] ⚪ Image preview on hover (lightbox or popover)
- [ ] ⚪ Delete with confirmation
- [ ] ⚪ Usage indicator: show which posts use this asset (if any)
- [ ] ⚪ Stock image search via Unsplash (Phase 11)
- [ ] ⚪ External drive integrations: Google Drive / Dropbox (Phase 11)
- **Status:** ⚪ To Do

---

## Templates

*Reusable captions at `/dashboard/templates`.*

- [ ] ⚪ Template cards with caption preview (truncated), hashtag chips, and platform targets
- [ ] ⚪ One-click "Use Template" → opens composer pre-filled
- [ ] ⚪ Tag/category filter
- [ ] ⚪ Duplicate template action
- **Status:** ⚪ To Do

---

## AI Studio

*Caption and content generation at `/dashboard/ai-studio`.*

**Phase 10:** Wire basic caption generation (Anthropic `claude-haiku-4-5`).
**Phase 11:** Brand voice, per-platform adaptation.

- [ ] ⚪ Caption generator: topic input + tone selector + platform → returns caption + hashtags
- [ ] ⚪ "Send to Composer" button — populates new post with generated content
- [ ] ⚪ Brand voice config: user can provide 3 example posts to calibrate tone
- [ ] ⚪ Per-platform adaptation: one caption → variants optimized for each platform (Phase 11)
- **Status:** ⚪ To Do

---

## Analytics

*Engagement metrics at `/dashboard/analytics`.*

**Publer benchmark:** Line chart for follower growth, bar chart for engagement per platform, date range picker.

- [ ] ⚪ Line chart: follower growth over 30/90 days (per platform)
- [ ] ⚪ Bar chart: engagement by platform (likes, comments, shares, clicks)
- [ ] ⚪ Date range picker (7 days / 30 days / 90 days / custom)
- [ ] ⚪ Per-platform breakdown with platform icons
- [ ] ⚪ Publish success rate stat: X of Y posts succeeded (last 30 days)
- [ ] ⚪ Top performing posts: ranked by engagement
- [ ] ⚪ CSV export for all metrics
- **Status:** ⚪ To Do

---

## Publish Queue

*Job status dashboard at `/dashboard/publish-queue`.*

**Critical differentiator:** Silent failures are the #1 competitor complaint. Our queue must be the most transparent in the category.

- [ ] ⚪ Filter tabs: All / Pending / Running / Success / Failed / Cancelled
- [ ] ⚪ Failed jobs: show exact error message, which platform failed, timestamp
- [ ] ⚪ 1-click Retry on each failed job
- [ ] ⚪ Retry count and "next attempt in X minutes" for RETRY status jobs
- [ ] ⚪ Success jobs: show published timestamp, link to live post (if available)
- [ ] ⚪ Bulk retry for all FAILED jobs
- [ ] ⚪ Auto-refresh every 30s while jobs are in RUNNING state
- [ ] ⚪ Skeleton loading states
- **Status:** ⚪ To Do

---

## Unified Inbox

*Social messages and comments at `/dashboard/inbox`.*

**Key differentiator vs Publer:** Publer has NO inbox at any price point below Business ($49/mo). Ours must be genuinely excellent — this is the product's signature feature.

**Target layout:** 3-panel (account list → thread list → thread view). See `docs/DESIGN_SYSTEM.md` for wireframe.

- [ ] ⚪ 3-panel layout: account list (120px) | thread list (280px) | thread view (flex-1)
- [ ] ⚪ Account filter: show all or filter by platform/account
- [ ] ⚪ Thread list: @handle, message preview, timestamp, read/unread indicator
- [ ] ⚪ Sentiment badges on thread rows: positive / neutral / negative
- [ ] ⚪ Unread count badge on sidebar nav icon
- [ ] ⚪ Inline reply: type and send without leaving the inbox view
- [ ] ⚪ Mark as read / unread
- [ ] ⚪ Search threads by @handle or keyword
- [ ] ⚪ Message tagging: VIP, Support, Lead (Phase 11)
- [ ] ⚪ AI quick-reply suggestions based on message context (Phase 15)
- **Status:** ⚪ To Do

---

## Leads Pipeline

*CRM at `/dashboard/leads`.*

**Publer benchmark:** N/A — Publer has no CRM. This is our moat.

- [ ] ⚪ Kanban board: NEW → CLICKED → CLOSED columns with drag-and-drop
- [ ] ⚪ Lead cards: @handle, platform, source (inbox/bot/link-click), timestamp
- [ ] ⚪ Lead detail drawer: full message history, source events, notes
- [ ] ⚪ Convert lead to contact: add email, phone, name
- [ ] ⚪ Search and filter leads by status, platform, date
- [ ] ⚪ Lead count stat on dashboard overview
- **Status:** ⚪ To Do

---

## Notifications

*System alerts at `/dashboard/notifications`.*

- [ ] ⚪ Grouped by type: Publish failures first, then approvals, then general
- [ ] ⚪ Unread badge on sidebar icon
- [ ] ⚪ Mark all as read action
- [ ] ⚪ Notification types styled distinctly: failure (red), approval (blue), success (green)
- [ ] ⚪ Clicking a notification → navigates to the relevant item
- **Status:** ⚪ To Do

---

## Approvals

*Post review workflow at `/dashboard/approvals`.*

**Publer benchmark:** Publer gates approvals to Business tier ($49/mo). We offer this at Starter ($19/mo).

- [ ] ⚪ Pending approvals queue: post preview, requester, date requested
- [ ] ⚪ Approve / Reject with optional reason field
- [ ] ⚪ Approved → post status updates to SCHEDULED automatically
- [ ] ⚪ Rejected → post returns to DRAFT with rejection reason visible to author
- [ ] ⚪ Email or in-app notification to requester on decision
- **Status:** ⚪ To Do

---

## RSS Campaigns

*Automated content from feeds at `/dashboard/rss-campaigns`.*

- [ ] ⚪ Campaign list: name, feed URL, active/paused toggle, last fetched timestamp
- [ ] ⚪ Content filter: "only post if title contains keyword"
- [ ] ⚪ Scheduling window: "only post between 9am–5pm"
- [ ] ⚪ Preview last fetched items before activating
- **Status:** ⚪ To Do

---

## Webhooks

*Outgoing integrations at `/dashboard/webhooks`.*

- [ ] ⚪ Webhook list: name, URL, events subscribed, last triggered
- [ ] ⚪ Test webhook button: sends sample payload
- [ ] ⚪ Delivery log: last 20 webhook attempts with status codes
- **Status:** ⚪ To Do

---

## Connections

*Social account OAuth at `/dashboard/connections`.*

**Publer benchmark:** Clear account health status, one-click reconnect for expired tokens, platform logos.

- [ ] ⚪ Account cards: platform icon, @handle, connection status (healthy/expiring/disconnected)
- [ ] ⚪ Token expiry warning: "Expires in 3 days — reconnect now" with clear CTA
- [ ] ⚪ Reconnect flow: click reconnect → OAuth popup → back to connections page with updated status
- [ ] ⚪ Last synced timestamp per account
- [ ] ⚪ Disconnect with confirmation
- [ ] ⚪ Platform support: Instagram, Facebook, Twitter/X, LinkedIn, TikTok (add missing platforms per Phase 11)
- **Status:** ⚪ To Do

---

## Link Pages

*Bio-link builder at `/dashboard/link-pages`.*

- [ ] ⚪ Page list: title, slug, published status, click count (last 30 days)
- [ ] ⚪ Theme editor: color pickers, font selector, background options
- [ ] ⚪ Live preview panel while editing
- [ ] ⚪ Publish/unpublish toggle
- [ ] ⚪ Click analytics per link item
- **Status:** ⚪ To Do

---

## Bot Rules

*Automation triggers at `/dashboard/bot-rules`.*

**Publer benchmark:** N/A — Publer has no bot rules. This is our moat.

- [ ] ⚪ Rule list: name, match type, trigger word/pattern, reply preview, active toggle
- [ ] ⚪ Rule builder: match type (CONTAINS/REGEX/ANY), trigger value, reply text, cooldown
- [ ] ⚪ Test rule: input a sample message → shows whether rule would fire
- [ ] ⚪ Action log: recent bot actions (matched message, rule triggered, reply sent)
- **Status:** ⚪ To Do

---

## Team

*Organization settings at `/dashboard/team`.*

- [ ] ⚪ Member list: avatar, name, email, role badge, joined date
- [ ] ⚪ Invite by email: sends invite link
- [ ] ⚪ Role change: dropdown to change MEMBER ↔ ADMIN (OWNER cannot be changed)
- [ ] ⚪ Remove member with confirmation
- [ ] ⚪ Team usage stats: accounts connected, posts scheduled by member
- **Status:** ⚪ To Do

---

## Subscription Plans

*Billing management at `/dashboard/subscription`.*

**Phase 12 deliverable (Stripe integration required first).**

- [ ] ⚪ Current plan display: plan name, billing cycle, next renewal date, features included
- [ ] ⚪ Upgrade/downgrade plan: shows plan comparison table with pricing
- [ ] ⚪ Usage meters: seats used / total, accounts connected / total
- [ ] ⚪ Link to Stripe Customer Portal: manage payment method, cancel subscription
- [ ] ⚪ Billing history: past invoices with download links
- [ ] ⚪ Cancellation flow: shows retention offer (1-month discount), then confirms cancellation
- **Status:** ⚪ To Do (Phase 12)

---

## Support

*Helpdesk at `/dashboard/support`.*

- [ ] ⚪ Ticket list: subject, status badge (OPEN/CLOSED), last reply timestamp
- [ ] ⚪ Ticket thread view: chronological messages, reply input at bottom
- [ ] ⚪ Create new ticket: subject + message
- [ ] ⚪ Admin view: all user tickets, assign, close
- **Status:** ⚪ To Do

---

## Documentation

*In-app guides at `/dashboard/docs`.*

- [ ] ⚪ Sidebar navigation within docs: User Manual sections
- [ ] ⚪ Admin Guide only visible when role = ADMIN
- [ ] ⚪ Search within docs (client-side, markdown heading/content search)
- **Status:** ⚪ To Do

---

## Admin Console

*System administration at `/admin`.*

- [ ] ⚪ User table: search, filter by role, view user's team and plan
- [ ] ⚪ Audit logs: filterable by action type, user, date range
- [ ] ⚪ Feature flag toggles: enable/disable features globally or per-user
- [ ] ⚪ Platform health monitors: API connectivity status per social platform
- [ ] ⚪ Publish queue stats: jobs by status, failure rate over time
- **Status:** ⚪ To Do

---

## Interaction Test Log

*Record results of manual interaction tests during development.*

| Date | Feature | Test Description | Result | Action Items |
| :--- | :------- | :--------------- | :----- | :----------- |
|      |          |                  |        |              |
