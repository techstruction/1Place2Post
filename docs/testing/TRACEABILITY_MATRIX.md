# 1Place2Post Traceability Matrix

This matrix maps core features of **1Place2Post** to their corresponding automated or manual test coverage components. This ensures no major functionality goes untested.

| Feature Area | Specific Function | Test Case / Script | Coverage Type | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **Identity / Auth** | User Registration & JWT | `auth-registration.spec.ts` | E2E / API | User successfully created, JWT returned. |
| **Identity / Auth** | Social Account Linking | `auth-oauth-link.spec.ts` | E2E / Manual | OAuth redirect succeeds; row added to DB; Token valid. |
| **Posting Engine** | "Create Once, Post Everywhere" | `create-post.spec.ts` | E2E | Unified modal opens, variants set, queues to DB. |
| **Posting Engine** | Scheduled Job Execution | `queue-processor.spec.ts` | Integration | Scheduled job executes exactly at Cron time, hits 3rd party API. |
| **Posting Engine** | Bulk CSV Upload | `bulk-csv.spec.ts` | E2E / API | CSV parsed, 50 rows inserted to Queue without 504 Timeout. |
| **Media Library** | S3 Multipart Upload | `media-upload.spec.ts` | E2E | 50MB MP4 chunked successfully and preview generated. |
| **Workflows / Team** | Post Approval Pipeline | `team-approvals.spec.ts` | E2E | "Member" triggers Request; "Admin" Approves; Post schedules. |
| **Automations** | RSS Campaigns | `rss-fetcher.spec.ts` | Integration | Cron polls valid XML, creates Drafts; Invalid XML logged as Error. |
| **Automations** | Webhook Sales Bot | `webhook-ingest.spec.ts` | API | HMAC validated payload triggers auto-DM response rule. |
| **Analytics** | Link-in-Bio Tracking | `link-tracking.spec.ts` | API | Click on `l/slug` redirects to target, increments Click counter. |
| **Infrastructure** | Rate Limit Resilience | `rate-limit-backoff.spec.ts` | Load / Unit | 429 error from Social API forces job back to queue with delay. |
