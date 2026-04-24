# Annealing Log — 1Place2Post

> "Annealing" (from metallurgy): heating and controlled cooling to remove defects and strengthen structure.
> This document records mistakes made during development — what went wrong, why, and how to avoid it.
> Every agent session should read this before writing code. Every session that finds a new mistake should add to it.

---

## Phase 10 — Design System & UI Overhaul (2026-04-24)

---

### MISTAKE 1: Tailwind v4 @config path is relative to the CSS file, not the package root

**What happened:** The initial implementation put `@config "./tailwind.config.ts"` in `app/globals.css`. This resolves relative to `app/`, so it looked for `app/tailwind.config.ts` — which doesn't exist. The correct path is `@config "../tailwind.config.ts"` because the config lives at `apps/web/tailwind.config.ts`, one level up from `apps/web/app/`.

**Why it's subtle:** In Tailwind v3, `tailwind.config.ts` is auto-detected at the project root by the PostCSS plugin. In Tailwind v4, you must explicitly reference it via `@config` inside the CSS file. The path resolution is relative to the CSS file's location, not the working directory or package root. This is not documented prominently.

**Symptom:** All custom Tailwind utility classes (`bg-brand-500`, `font-display`, `rounded-card`, etc.) silently generate no output. No build error — things just don't work visually.

**How to check:** `grep "@config" apps/web/app/globals.css` — should show `@config "../tailwind.config.ts"`.

**Rule:** When `globals.css` is in a subdirectory (e.g., `app/`), the `@config` path needs `../` to reach the package root.

---

### MISTAKE 2: shadcn/ui CLI does not auto-install class-variance-authority in Tailwind v4 projects

**What happened:** After running `npx shadcn@latest add button badge card ...`, TypeScript failed because `class-variance-authority` was not installed, even though generated component files import it. The CLI added all Radix UI packages but skipped `class-variance-authority`.

**Why it's subtle:** In Tailwind v3 projects, the shadcn init process installs `class-variance-authority` automatically. In Tailwind v4 projects, the CLI detects the setup differently and skips it.

**Fix:** Always run `npm install class-variance-authority` alongside shadcn component installs. It should be in `dependencies`.

**Rule:** After any `npx shadcn@latest add`, verify `package.json` has `class-variance-authority`. If missing, install it.

---

### MISTAKE 3: lucide-react removed social platform brand icons in recent versions

**What happened:** The plan called for `Instagram`, `Facebook`, `Twitter`, `Linkedin`, `Youtube` icon imports from `lucide-react`. The installed version (1.x) no longer exports these. The `PlatformBadge` component had to use generic substitutes (`Camera`, `Share2`, etc.).

**Why it happened:** Lucide removed brand/logo icons from its library because maintaining third-party brand icons violates trademark policies. This happened gradually across 2023–2024 versions.

**What we did:** Used generic Lucide icons with correct brand hex colors. The visual identity is conveyed by color, not icon shape. This is an acceptable trade-off for now.

**Future option:** Install `react-icons` (which has `FaInstagram`, `FaFacebook`, etc. via Font Awesome brand icons) or use inline SVG logos. `react-icons` is large — consider tree-shaking imports.

**Rule:** Do not plan to use `lucide-react` for social platform brand icons. They don't exist. Use `react-icons/fa` or SVGs.

---

### MISTAKE 4: CSS border shorthand + border: 'none' + longhand properties conflict in inline styles

**What happened:** A React inline style object had this pattern:
```js
{
  borderBottom: '1px solid var(--border-subtle)',  // sets borderBottom
  border: 'none',                                   // resets ALL borders, including borderBottom
  borderBottomWidth: 1,                             // re-applies bottom border
  borderBottomStyle: 'solid',
  borderBottomColor: 'var(--border-subtle)',
}
```
The `borderBottom` shorthand on line 1 is immediately overwritten by `border: 'none'` on line 2. It's dead code — the visual output is correct (the three longhands win), but the first line is confusing noise.

**Rule:** When using `border: 'none'` to reset borders and then re-applying a specific border via longhands, don't also set the shorthand. Just use:
```js
{
  border: 'none',
  borderBottomWidth: 1,
  borderBottomStyle: 'solid',
  borderBottomColor: 'var(--border-subtle)',
}
```

---

### MISTAKE 5: useEffect fetch without AbortController causes dangling state updates

**What happened:** `PublishFailureBanner` initially had:
```tsx
useEffect(() => {
  fetch(...).then(...).then(setFailedCount).catch(() => {});
}, []);
```
If the component unmounts before the fetch resolves (fast navigation), React will call `setFailedCount` on an unmounted component. In React 18 this is suppressed, but it is still a memory leak and a sign of poor hygiene.

**Fix:**
```tsx
useEffect(() => {
  const controller = new AbortController();
  const token = localStorage.getItem('1p2p_token');
  if (!token) return () => controller.abort();
  fetch(url, { signal: controller.signal, ... })
    .then(...)
    .catch(() => {});
  return () => controller.abort();
}, []);
```

**Rule:** Every `fetch` inside a `useEffect` must use AbortController with `return () => controller.abort()` as cleanup. No exceptions.

---

### MISTAKE 6: Stale purple RGBA hardcodes survived the CSS variable migration

**What happened:** After replacing `--accent: #7c5cfc` (purple) with `--accent: var(--brand-500)` (blue `#4F6EF7`), two places in `globals.css` still used the old purple as hardcoded `rgba()` values:
- `.nav-item.active` box-shadow: `rgba(124, 92, 252, 0.25)` 
- `.auth-wrap` radial gradient: `rgba(124, 92, 252, 0.08)`

These were caught by code quality review but required a separate fix commit.

**Why it happened:** A grep for `#7c5cfc` would catch hex references. But `rgba(124, 92, 252, ...)` is the same color in a different format — harder to find with a simple search.

**Rule:** When migrating a brand color, grep for BOTH the hex value AND the RGB decimal equivalent:
```bash
grep -r "7c5cfc\|124, 92, 252\|7C5CFC" apps/web/
```

---

### MISTAKE 7: Double-padding when wrapping main content in a flex container

**What happened:** The original `dashboard/layout.tsx` had:
```tsx
<main className="main-content">{children}</main>
```
And `.main-content` in CSS had `padding: 2rem`. When we added `PublishFailureBanner` as a sibling to `{children}`, we wrapped them in a div:
```tsx
<div className="main-content" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
  <PublishFailureBanner />
  <div style={{ padding: '2rem' }}>{children}</div>
</div>
```
This correctly sets the outer wrapper padding to 0 and the inner div to `2rem`. BUT the CSS class `.main-content` originally had `padding: 2rem` — which we needed to remove from CSS to prevent applying it on top of our inline `padding: 0`.

**Fix:** Remove `padding: 2rem` from `.main-content` in `globals.css` when taking over padding control via inline styles.

**Rule:** When overriding a CSS class's layout property with an inline style, check what the CSS class currently sets and remove the conflicting property from CSS. Don't rely on inline `padding: 0` to override a CSS class `padding: 2rem` when you actually need zero padding — the inline style wins at runtime, but it's confusing and fragile.

---

### MISTAKE 8: CSS variable cleanup scope was too narrow (auth/callback and docs/layout missed)

**What happened:** Task 8 scoped the CSS variable cleanup to `app/admin/`, `app/login/`, and `app/register/`. After the review, the reviewer found that `app/auth/callback/page.tsx` and `app/docs/layout.tsx` still used the old legacy variable names (`--bg-main`, `--color-heading`). These were caught only because the spec reviewer ran a broad grep.

**Rule:** When doing a codebase-wide CSS variable rename, always grep the entire `app/` tree:
```bash
grep -rn "var(--legacy-name)" apps/web/app/ --include="*.tsx"
```
Don't scope the grep to only the directories you think are affected.

---

### MISTAKE 9: loadData defined inside component but used in useEffect with empty deps causes lint warning

**What happened:** In `inbox/page.tsx`, `loadData` is defined as a regular `async function` inside the component, then called in:
```tsx
useEffect(() => { loadData(); }, []);
```
ESLint's `react-hooks/exhaustive-deps` rule will flag this: `loadData` is a function defined in the component scope, so it appears in the dependency array analysis. However, `loadData` itself references `router` and `selectedId` state, meaning it changes on every render.

The correct pattern is one of:
1. Move the fetch logic directly into the `useEffect` callback
2. Wrap `loadData` in `useCallback` with proper deps
3. Suppress with `// eslint-disable-next-line react-hooks/exhaustive-deps` if intentional

We left this as a lint warning (not a runtime bug), but it should be addressed in Phase 11.

**Rule:** Functions that are called in `useEffect` and defined inside the component must either be defined inside the effect callback or wrapped in `useCallback`. Never put a bare component-scope function in a `useEffect` with `[]` deps.

---

### MISTAKE 10: Skeleton loading was only added to one page (dashboard overview)

**What happened:** The Phase 10 spec called for "skeleton screens for all loading states." The plan prioritized `dashboard/page.tsx` as the example implementation. All 20 other dashboard pages (posts, calendar, media, templates, inbox, leads, etc.) still have `<p>Loading…</p>` or similar inline text.

The inbox and composer pages were rebuilt from scratch and don't have this issue, but the remaining 18 pages (posts list, calendar, analytics, connections, team, etc.) need skeleton treatment.

**Rule:** "All loading states" means all pages. When implementing skeleton screens, create a checklist of every page with a loading state and track completion. Don't declare victory after one page.

**Phase 11 task:** Add `SkeletonCard`/`SkeletonRow`/Skeleton components to all remaining 18 dashboard pages.

---

### MISTAKE 11: @config path was the last bug caught — only by the production build

**What happened:** Mistakes 1 (wrong `@config` path `./tailwind.config.ts` instead of `../tailwind.config.ts`) was caught during the production build step (Task 9), not during development. The TypeScript check passes because TypeScript doesn't know about CSS `@config` directives. The Next.js dev server might also not catch it if hot reload caches the old CSS.

**Rule:** Always run `npm run build` (not just `tsc --noEmit`) as the final verification before declaring any frontend task complete. The production build catches things that TypeScript and the dev server miss.

---

## General Rules Extracted from Phase 10

These are distilled from the above mistakes into standing rules for all future frontend work:

| # | Rule |
|---|---|
| 1 | `@config` path in `globals.css` is relative to the CSS file location, not the package root |
| 2 | After `npx shadcn@latest add`, always verify `class-variance-authority` is in `package.json` |
| 3 | `lucide-react` has no social brand icons — use `react-icons/fa` or SVGs for platform logos |
| 4 | CSS shorthand + `border: none` + longhand = dead shorthand. Use only longhand or only shorthand |
| 5 | Every `fetch` in `useEffect` must use `AbortController` with cleanup |
| 6 | When migrating a color, search for hex AND rgba decimal equivalent |
| 7 | When taking over padding via inline style, remove it from the CSS class too |
| 8 | CSS variable cleanup greps must target the entire `app/` tree, not just the obvious files |
| 9 | `loadData` pattern: move fetch into effect body, or use `useCallback` |
| 10 | "All pages" means all pages — track a checklist for cross-cutting changes |
| 11 | Run `npm run build` as the final test — not just `tsc --noEmit` |
