# 1Place2Post Development Roadmap

This document outlines the strategic progression of features from the initial infrastructure setup through the finalized enterprise suite.

## 🟢 Completed Milestones (Phases 0 - 8)

### Phase 0: Foundation
- [x] Monorepo scaffold (Next.js + NestJS + Prisma).
- [x] Docker Containerization (Web, API, Postgres).
- [x] Core CI/CD staging deployment scripts.

### Phase 1: Identity & Core Posting
- [x] JWT Authentication & User Registration.
- [x] Social Accounts Management (add, list, delete).
- [x] Base Post Scheduling CRUD Operations.
- [x] Dashboard UI / Layout initialization.

### Phase 2: Engagement & Link-in-Bio
- [x] Link Pages (`/l/:slug`) generation with dynamic link tracking.
- [x] Bot Rules engine (`CONTAINS`, `REGEX`, `ANY`) for webhooks.
- [x] Content Series / Campaign categorization.

### Phase 3: Assets & Teams
- [x] Media Asset Library with local disk multi-part uploads.
- [x] Reusable Post Templates.
- [x] Team Workspaces (Role-based access: OWNER, ADMIN, MEMBER).
- [x] Base Analytics engine (click tracking, global views).

### Phase 4: Enterprise Workflows
- [x] Post Approvals pipeline (Request -> Review -> Approve/Reject).
- [x] RSS Campaigns for automated content fetching.
- [x] Outgoing Webhooks (Firing events to external services).
- [x] Visual Link-Bio Theme builder (colors, layouts).

### Phase 5: Reliability & Support
- [x] Postgres-backed custom Job Queue for reliable publishing (exponentional backoff).
- [x] In-app Notification center.
- [x] Support Ticketing system (threaded messages).

### Phase 6: Unified Comms
- [x] Unified Inbox (Aggregating DMs and Comments).
- [x] Advanced Bot Rules (Auto-reply Modes, Cooldown timers).
- [x] Leads CRM Pipeline (auto-generating contacts from engagements).
- [x] Webhook Ingest router.

### Phase 7: Interactive Documentation
- [x] In-app User Manual embedded in Next.js.
- [x] In-app Administrator Guide.
- [x] Integrated Markdown rendering engine.

### Phase 8: Security & Administration
- [x] Google OAuth (Passport.js integration).
- [x] Global Admin Console (User management, Audit Logs).
- [x] Platform Health Monitors.
- [x] Feature Flags (Dynamic functionality toggles).

---

## 🟡 Upcoming Milestones

### Phase 9: Testing Stage I
- [ ] **Unit & Integration Setup**: Scaffold the test environment and seed database accounts. Establish API validation for all endpoints.
- [ ] **Functional & UI Tests**: Develop E2E Playwright tests including `create-post.spec.ts` and automated visual regression checks.
- [ ] **Specialized Features Q/A**: Build validation tests around RSS parsing, Bot Rules engine accuracy, and Link-in-Bio routing.
- [ ] **Security Audits**: Preliminary fuzzing of the API, testing JWT scope limitations and OAuth integrity.

### Phase 10: Scale & Optimization
- [ ] **Rate Limiting Engine**: Implement NestJS Throttler guards to protect public-facing endpoints (e.g. tracking links, authentication).
- [ ] **Storage Migration**: Migrate local `uploads/` disk storage to cloud-based S3/R2 object storage for distributed horizontal scaling.
- [ ] **Redis Integration**: Move current Postgres-backed queue system to a dedicated Redis cluster (BullMQ) for high-throughput job processing and WebSocket pub/sub.

### Phase 11: AI Agents & Advanced Automations
- [ ] **LLM Integration**: Expand "AI Studio" beyond basic templates to analyze incoming DMs and auto-generate contextually aware replies using OpenAI/Anthropic APIs.
- [ ] **Sentiment Analysis**: Automatically flag and route angry or urgent inbox messages directly to the Support module.
- [ ] **Smart Scheduling**: Machine learning algorithms to suggest optimal posting times based on historical user engagement metrics.

### Phase 12: Enterprise Identity
- [ ] SAML / SSO Integration (Okta/Entra ID) for enterprise team clients.
- [ ] Granular Custom Permissions (beyond static Owner/Admin/Member).
- [ ] Two-Factor Authentication (2FA) enforcement.

### Phase 13: External Ecosystem
- [ ] **Public Developer API**: Interactive Swagger/OpenAPI documentation allowing customers to build custom integrations.
- [ ] **Mobile App**: React Native or Flutter application bringing the Unified Inbox and Push Notifications natively to iOS/Android.

### Phase 14: Testing Stage II
- [ ] **Performance & Stress Testing**: Implement Load testing (e.g. JMeter/k6) simulating 100+ concurrent bulk scheduling actions.
- [ ] **Rate Limiting Engine Q/A**: Verify infrastructure gracefully handles 429 API errors from Social platforms without crashing the worker queues.
- [ ] **Redundancy & Failover**: Chaos engineering tests on the Redis job queue and Postgres database failovers.
