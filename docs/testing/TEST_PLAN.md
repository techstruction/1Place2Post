# 1Place2Post Strategy Test Plan

## 1. Scope & Objective
This document defines the approach for validating **1Place2Post**, a comprehensive social automation platform. The objective is to ensure system stability, correct functioning of all third-party integrations (Social APIs), reliable background job execution (RSS Campaigns, Bot Rules), and UI responsiveness.

The goal is to provide a robust experience comparable to enterprise competitors like *Content360.io*.

## 2. Roles & Responsibilities
- **QA Automation Engineer:** Develops Playwright UI scripts and Postman/Newman collections for API validation.
- **Backend Engineer:** Monitors Redis/Postgres queues and manages webhook idempotency.
- **Product Owner:** Validates the visual components (Unified Inbox, Calendar layout).

## 3. Required Accounts & Environments
To properly test without risking primary brand accounts:
- **Burner Accounts:** At least 2-3 dedicated non-critical accounts per platform (X/Twitter, LinkedIn, TikTok, Instagram, Facebook Pages).
- **User Personas:** 
  - `admin@test.local` (Owner)
  - `creator@test.local` (Creator - no billing access)
  - `member@test.local` (Requires Approval for posts)
- **Developer API Keys:** OpenAI/Anthropic keys specifically for test environments.

## 4. Test Data Sets
A folder of diverse media and payloads must be maintained:
- **Large Video Assets:** 4K `.mp4` files (stress-testing upload limits).
- **Format Edge Cases:** Corrupted JPEGs, `.gif` files, `9:16` vs `1:1` aspect ratios to ensure the UI calendar and API gracefully handle errors or formatting requirements.
- **RSS Feeds:** 
  - Known valid feeds (e.g., standard WordPress RSS).
  - Malformed XML to test error resilience and logging.
- **Webhook Payloads:** JSON samples testing the *Sales Bot* triggers and Link-in-bio events.

## 5. Testing Phases

### Phase 1: Unit & Integration (The Foundation)
- **API Validation:** Testing all endpoints (`/schedule`, `/media`, `/auth`) for correct status codes (200, 400, 401, 429).
- **Social Token Refresh:** Verifying the background jobs successfully refresh expired tokens or alert the user gracefully.

### Phase 2: Functional & UI Testing
- **Visual Calendar & Layouts:** Creating one base post with distinct platform variants and ensuring the calendar accurately previews them.
- **Bulk Uploads:** CSV data ingestion (50+ rows) to verify the system queues content without timeouts.

### Phase 3: Specialized Features
- **AI Content Generator:** Prompting the "AI Studio" and validating relevance/hallucinations for specific copy context.
- **Sales Bot Engine:** Simulating a comment to an Instagram post, verifying the webhook ingest, and triggering a DM reply.
- **Webhook Authenticity:** Verifying the rejection of payloads lacking correct HMAC signatures.

### Phase 4: Performance & Stress Testing
- **Load Testing (JMeter/K6):** Simulating 100+ concurrent users scheduling posts to monitor database locks or Redis saturation.
- **Rate Limit Resilience:** Deliberately hitting 429 errors from LinkedIn/Instagram APIs to ensure the job queue falls back to exponential backoff gracefully instead of crashing.

## 6. Best Practices
- **Idempotency checks:** If a user double-clicks "Publish Now", only one database record and one API call should execute.
- **Cross-Browser:** The unified dashboard must be tested on Chrome, Firefox, Safari Desktop, and Safari Mobile.
