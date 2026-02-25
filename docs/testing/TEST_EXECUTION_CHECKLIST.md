# 1Place2Post Test Execution Checklist

This document provides a step-by-step guide to executing the testing strategy for the **1Place2Post** platform. Use this checklist to track progress through the testing phases.

---

## Phase 1: Preparation & Setup

Before running tests, ensure the environment is correctly configured.

- [ ] **1. Create Test Accounts**
  - [ ] Create an "Owner" user (`admin@test.local`).
  - [ ] Create a "Creator" user (`creator@test.local`, restricted billing access).
  - [ ] Create a "Member" user (`member@test.local`, requires post approval).
- [ ] **2. Link Social Accounts (Burners)**
  - [ ] Link a test LinkedIn account.
  - [ ] Link a test Instagram account.
  - [ ] Link a test TikTok or X/Twitter account.
- [ ] **3. Populate Test Data**
  - [ ] Upload an image file (`< 5MB`) to the Media Library.
  - [ ] Upload a large video file (`~50MB` MP4) to the Media Library.
  - [ ] Upload an optimally sized image (e.g., `1:1` aspect ratio) and a sub-optimal image (`9:16` aspect ratio).
- [ ] **4. Configure External Integrations**
  - [ ] Set up the OpenAI/Anthropic test API key in the environment variables.
  - [ ] Prepare an RSS feed URL (e.g., a standard WordPress blog feed) for testing.
  - [ ] Prepare a mock webhook endpoint (e.g., using Webhook.site) to receive outgoing payloads.

---

## Phase 2: Core Platform Functionality (Manual & Automated)

Verify the primary user journeys and crud operations.

- [ ] **5. Identity & Access**
  - [ ] Attempt registration with valid credentials.
  - [ ] Attempt login with invalid credentials (verify error message).
  - [ ] Attempt login with valid credentials (verify JWT creation and dashboard access).
- [ ] **6. The "Create Once, Post Everywhere" Flow**
  - [ ] Open the "Create Post" modal.
  - [ ] Select multiple social networks (e.g., LinkedIn, Instagram).
  - [ ] Write base content and attach media.
  - [ ] Customize content for one specific platform.
  - [ ] Schedule the post for a future time.
  - [ ] Verify the "Success" toast appears.
  - [ ] Navigate to the Visual Calendar and confirm the post appears on the correct date with the correct platform icons.
- [ ] **7. Team Approvals**
  - [ ] Login as `member@test.local` and create a post.
  - [ ] Submit the post for approval (it should enter the 'draft' or 'pending review' state).
  - [ ] Login as `admin@test.local`, review the pending post, and approve it.
  - [ ] Verify the post moves to the scheduled state.
- [ ] **8. Media Assets**
  - [ ] Upload a file.
  - [ ] Verify it appears in the Media Library.
  - [ ] Attempt to delete the file and verify it is removed from the UI (and storage).

---

## Phase 3: Background Jobs & Integrations

Test the async workers and third-party APIs.

- [ ] **9. Post Publishing (Background Queue)**
  - [ ] Wait for a scheduled post's execution time to pass.
  - [ ] Verify that the post is successfully published to the burner social accounts.
  - [ ] Verify the post status updates to "Published" in the application.
- [ ] **10. RSS Campaigns**
  - [ ] Create an RSS campaign using a valid feed URL.
  - [ ] Trigger the polling mechanism (or wait for the cron job).
  - [ ] Verify that new draft posts are automatically created based on the RSS feed entries.
- [ ] **11. AI Content Generation**
  - [ ] Open the Compose modal.
  - [ ] Input a prompt into the AI Studio field.
  - [ ] Generate content and verify the result is relevant to the prompt.
- [ ] **12. Webhooks & Sales Bot**
  - [ ] Simulate an incoming webhook payload containing a "comment" event (with HMAC signature).
  - [ ] Verify the Bot Rules engine processes the condition (e.g., "CONTAINS: 'link'").
  - [ ] Verify an outgoing DM payload is constructed and fired.

---

## Phase 4: Error Handling & Edge Cases

Ensure the application gracefully handles unexpected conditions.

- [ ] **13. API & Rate Limit Resilience**
  - [ ] Send 100+ requests to a single `/schedule` endpoint within 1 minute.
  - [ ] Verify the NestJS Throttler returns a `429 Too Many Requests` error instead of crashing.
  - [ ] Simulate a social platform returning a 429 error during a background job execution.
  - [ ] Verify the job queue pauses execution for that account and utilizes exponential backoff.
- [ ] **14. Form Validation & Bad Data**
  - [ ] Attempt to create a post with empty content and no media.
  - [ ] Verify the UI prevents submission and displays validation errors.
  - [ ] Provide an invalid RSS feed URL (e.g., a random website page instead of XML).
  - [ ] Verify the system logs the error appropriately without failing silently.
  - [ ] Send a Webhook payload with an invalid/missing HMAC signature.
  - [ ] Verify the endpoint rejects the request with a `401 Unauthorized` or `403 Forbidden` status.

---

## Phase 5: End-to-End Automation Initialization

Once manual flows are verified, automate the critical paths.

- [ ] **15. Execute UI Automation Scripts**
  - [ ] Install Playwright (`npm init playwright@latest` or `npm install -D @playwright/test` in the appropriate directory).
  - [ ] Run the `tests/e2e/create-post.spec.ts` script using `npx playwright test`.
  - [ ] Review the test run results and fix any selectors that do not match the current UI implementation.
