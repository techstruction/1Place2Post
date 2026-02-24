# 1Place2Post Admin Guide

Welcome to the **1Place2Post** Administrator Guide. This document details the procedures for managing the platform, configuring team environments, and maintaining the publishing infrastructure.

## 🔐 Table of Contents
1. [Team Management & Roles](#1-team-management--roles)
2. [Post Approval Workflows](#2-post-approval-workflows)
3. [Publish Queue Operations](#3-publish-queue-operations)
4. [Outgoing Webhooks](#4-outgoing-webhooks)
5. [Monitoring & System Health](#5-monitoring--system-health)

---

## 1. Team Management & Roles

1Place2Post uses a Role-Based Access Control (RBAC) system. When a workspace is created, the creator is assigned the `OWNER` role.

### Roles
- **OWNER**: Full access. Can delete the team, manage billing, and change user roles.
- **ADMIN**: Can invite/remove users, configure team-wide API settings, create Bot Rules, and approve posts.
- **MEMBER**: Standard operational role. Can create drafts, schedule posts, reply to support tickets, and view analytics. Note: Depending on workspace settings, MEMBERs may require an Admin's approval to publish.

### Adding Users
1. Go to **Team** in the sidebar.
2. Provide the user's email address and assign them a role.
3. An invitation link is delivered to them.

## 2. Post Approval Workflows

If an enterprise client requires strict content governance, the **Approvals** module handles this safely.
1. A user creates a post and submits it for review (status becomes `PENDING`).
2. Admins navigate to the **Approvals** tab in the sidebar.
3. The Admin can review the caption, hashtags, media, and scheduled time.
4. Using the Action buttons, they can:
   - **Approve**: Post status changes to `SCHEDULED` or `PUBLISHED`.
   - **Reject**: Post is reverted to `DRAFT` and flagged for the creator to rewrite.

## 3. Publish Queue Operations

1Place2Post relies on a Postgres-backed job queue to safely dispatch posts to social APIs.
The queue is managed at `/dashboard/jobs`.

### Queue Mechanics
- A background worker polls the `PublishJob` table every 15 seconds.
- It attempts to acquire a lock to prevent duplicate concurrent publishing.
- If an API call fails (e.g., Instagram is down), the queue implements **Exponential Backoff Delivery**. It will retry up to 3 times, exponentially increasing the delay between attempts.

### Admin Interventions
If a job is permanently stuck (Locked) due to a server crash mid-request:
1. Navigate to the **Publish Queue** (`/dashboard/jobs`).
2. Identify stuck jobs.
3. Admins can click **Reset Failed Locks**, which forcibly unlocks stale jobs and returns them to the pool for the next polling cycle.

## 4. Outgoing Webhooks

You can programmatically export data from 1Place2Post into external CRMs (like Salesforce, HubSpot, or n8n) via Outgoing Webhooks.

1. Go to **Webhooks** in the sidebar.
2. Click **Register Endpoint**.
3. Supply a valid `https://` receiving URL.
4. Subscriptions: Choose which events trigger the hook (e.g., `post.published`, `post.failed`, `lead.created`).
5. **Security**: We sign the payload with a shared HMAC-SHA256 secret. Your receiving server should compute the signature of the payload using the secret and compare it to the `X-1P2P-Signature` header to verify authenticity.

## 5. Monitoring & System Health

- **Platform Analytics**: The `/dashboard/analytics` view provides aggregate performance data. Admins should monitor error rates across social connections here.
- **Support Tickets**: Enterprise users can open tickets from their Dashboard. Admins see all tenant global tickets in the `/dashboard/support` area and can close them.
- **RSS Campaigns**: Admins can automate publishing from external blogs into 1Place2Post via the **RSS Campaigns** module. Ensure the XML feeds are valid to prevent queue congestion.
