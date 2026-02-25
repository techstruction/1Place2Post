# Bug Reports & Regression Suite

## Overview
This document serves as the foundation for the **1Place2Post Regression Suite**. It defines the critical paths that must be tested prior to every major production release to prevent the re-introduction of past bugs.

## Core Regression Suite (Must Pass Before Deploy)

The following E2E and Integration test suites must yield a `100% Pass Rate` before merging to `main`.

1. **Authentication Flow**
   - Register new user.
   - Login existing user.
   - Social Account token refresh cycle.
2. **Core Post Scheduling Engine**
   - Draft a multi-platform post.
   - Attach media from the Media Library.
   - Schedule for the future.
   - Verify visually in the Content Calendar.
3. **Automated Engagements (Sales Bot)**
   - Trigger a simulated comment webhook.
   - Verify the "Auto-Reply + DM" rule fires exactly once.
4. **Link-in-Bio System**
   - Create a link page.
   - Verify public page resolves correctly.

---

## Bug Report Log

*This table tracks significant issues found during Q/A or production. Once fixed, a corresponding regression test must be added to the automated suite.*

| Bug ID | Date Found | Component | Description | Resolution | Regression Test Added |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Example-01** | `YYYY-MM-DD` | Scheduler | Double-clicking 'Post' creates duplicate jobs | Added idempotency key constraint on Postgres | `[x] idempotent-post.spec.ts` |
| **Example-02** | `YYYY-MM-DD` | Media | 9:16 videos failing to upload to Instagram | Updated aspect ratio validation pre-flight | `[x] media-aspect-ratio.spec.ts` |
| **Example-03** | `YYYY-MM-DD` | Bot Rules | "Contains" rule failing on uppercase | Made RegEx matching case-insensitive | `[x] bot-rule-case.spec.ts` |
