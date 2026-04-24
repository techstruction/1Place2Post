# 1Place2Post — North Star

> The canonical product vision. Read this before any feature decision.

---

## Mission

Build the first social media management platform that treats **reliability, billing honesty, and small-team collaboration as the product itself** — not upsell tiers.

---

## The One-Sentence Pitch

1Place2Post is Publer for teams that need to manage conversations and grow leads, not just schedule posts.

---

## Target Customer

**Who:** Small creator teams, 2–10 people.

**Specifically:**
- Boutique social media managers handling 5–20 client accounts
- Creator businesses (podcasters, YouTubers, DTC brands) with 1–3 social staff
- Small-to-mid agencies below the Hootsuite/Sprout Social price point

**What they're doing now:** Paying $50–150/mo to Publer, Metricool, or SocialBee and hitting walls:
- Publer: No inbox ($40+/mo extra to unlock), per-account pricing escalates fast
- Metricool: Surprise $324 auto-renewal charges, no team collaboration without agency tier
- SocialBee: $49→$99 cliff just to add a second team member

**What they want:** A single tool that posts reliably, lets the team collaborate without pricing penalties, and turns social engagement into paying customers.

---

## Three Positioning Pillars

### 1. "Posts that actually post"
Silent publishing failures are the #1 complaint across every competitor. We own reliability:
- Publish success rate stat on pricing page and in-app dashboard
- Prominent failure alerts — global banner, not buried in logs
- Per-post publish log (what happened, on which platform, at what time)
- Isolated job handling — one failed post never stalls others
- Exponential backoff with visible retry status

### 2. "Real team tools at creator prices"
- Approvals workflow, role-based access, and unified inbox at the $19/mo Starter tier
- Flat pricing: 1 user, 5 users, 15 users — no per-seat escalation
- No per-account surcharges
- At $49/mo (5 users, 20 accounts), 40% cheaper than an equivalent Publer plan

### 3. "Social media that grows your business"
- Bot Rules + Unified Inbox + CRM pipeline = comment → DM → lead → customer
- No competitor in the Publer price band ($12–$99/mo) has all three
- Frame the product as revenue infrastructure, not scheduling software

---

## Direct Competitor Profile: Publer

| Attribute | Publer | 1Place2Post |
|---|---|---|
| ARR | ~$3M | Pre-revenue |
| Users | ~350K | Pre-launch |
| Entry price | $12/mo | $19/mo |
| Unified inbox | Business tier only ($49/mo) | All tiers ($19/mo) |
| CRM pipeline | Not built | All tiers |
| Bot rules | Not built | All tiers |
| Per-account pricing | $4–7/account/month | Included in plan |
| Team approvals | Business tier | All tiers |
| Reliability | Good; bulk video crashes, periodic Meta reauth | Target: 99%+ publish rate |
| Founded | 2012, Tirana Albania | 2026 |
| Status | Bootstrapped, profitable | Pre-launch |

**Why Publer wins today:** 14 years of polish, name recognition, solid scheduling UX, 4.8/5 reviews.

**Why we win tomorrow:** Publer's gaps are structural — they never built inbox/CRM/bots. These are not features they're planning to add at the same price point; they're separate add-on tiers ($40+/mo). Our feature set exists at a price tier Publer simply doesn't offer.

---

## The Competitive Moat

Our moat requires ALL THREE to coexist in one tool at creator prices:
1. **Unified Inbox** (DMs + Comments across platforms)
2. **CRM Lead Pipeline** (auto-generated from inbox/bot interactions)
3. **Bot Rules Engine** (CONTAINS/REGEX/ANY — automated engagement)

No competitor at under $99/mo has all three. Publer has none.

---

## Competitive Landscape Summary

| Tool | Strength | Fatal Weakness for Our Target |
|---|---|---|
| Publer | Scheduling UX, reliability, brand trust | No inbox, no CRM, per-account pricing |
| Metricool | Analytics depth | Billing fraud reputation, no team collab at entry |
| SocialBee | Content categories, queue management | $49→$99 seat cliff, queue stall bugs |
| Content360 | Cheap lifetime deal | Posts fail to publish, AI-only support, billing fraud |
| Agorapulse | Best-in-class inbox | $299/mo — out of reach for 2–10 person teams |

---

## Design Principles

1. **Clarity first** — every screen communicates what's happening and what to do next
2. **Progressive disclosure** — advanced controls are there; they just don't scream at you
3. **Trust is a design output** — surface failures proactively; never hide problems
4. **Density without clutter** — power users hate wasted space; 13px compact UI is right
5. **Beautiful = usable** — polish and function are not in tension; the best tools are both

---

## What We Are Not Building

- An enterprise tool for 50+ seat organizations (that's Sprout Social's market)
- A content creation suite (AI image gen, full video editing — that's Canva's market)
- A social listening / brand monitoring tool (that's Brandwatch's market)
- A free-forever freemium tier (we are not optimizing for volume; we are optimizing for conversion and retention)
- A lifetime deal product (LTD economics attract support-heavy users and undermine ARR predictability)
