-- Phase 5: Publish Queue, Post Logs, Notifications, Support Tickets

-- Enums
DO $$ BEGIN CREATE TYPE "JobStatus" AS ENUM ('PENDING','RUNNING','RETRY','SUCCESS','FAILED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "PostLogType" AS ENUM ('INFO','ERROR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "NotificationType" AS ENUM ('INFO','SUCCESS','WARNING','ERROR','PUBLISH_SUCCESS','PUBLISH_FAILED','APPROVAL','SUPPORT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "TicketStatus" AS ENUM ('OPEN','CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "SupportSender" AS ENUM ('USER','SUPPORT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PostPublishJob
CREATE TABLE IF NOT EXISTS "PostPublishJob" (
  "id"          TEXT        NOT NULL,
  "postId"      TEXT        NOT NULL,
  "status"      "JobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts"    INTEGER     NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER     NOT NULL DEFAULT 5,
  "nextRunAt"   TIMESTAMP(3) NOT NULL,
  "lockedAt"    TIMESTAMP(3),
  "lastError"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PostPublishJob_pkey"   PRIMARY KEY ("id"),
  CONSTRAINT "PostPublishJob_postId_key" UNIQUE ("postId"),
  CONSTRAINT "PostPublishJob_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PostPublishJob_status_nextRunAt_idx" ON "PostPublishJob"("status","nextRunAt");

-- PostLog
CREATE TABLE IF NOT EXISTS "PostLog" (
  "id"        TEXT          NOT NULL,
  "postId"    TEXT          NOT NULL,
  "type"      "PostLogType" NOT NULL DEFAULT 'INFO',
  "message"   TEXT          NOT NULL,
  "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostLog_pkey"   PRIMARY KEY ("id"),
  CONSTRAINT "PostLog_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE
);

-- Notification
CREATE TABLE IF NOT EXISTS "Notification" (
  "id"        TEXT              NOT NULL,
  "userId"    TEXT              NOT NULL,
  "type"      "NotificationType" NOT NULL DEFAULT 'INFO',
  "title"     TEXT              NOT NULL,
  "body"      TEXT,
  "metaJson"  TEXT              NOT NULL DEFAULT '{}',
  "isRead"    BOOLEAN           NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId","isRead","createdAt");

-- SupportTicket
CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id"        TEXT           NOT NULL,
  "userId"    TEXT           NOT NULL,
  "subject"   TEXT           NOT NULL,
  "status"    "TicketStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3)   NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- SupportMessage
CREATE TABLE IF NOT EXISTS "SupportMessage" (
  "id"        TEXT            NOT NULL,
  "ticketId"  TEXT            NOT NULL,
  "sender"    "SupportSender" NOT NULL DEFAULT 'USER',
  "message"   TEXT            NOT NULL,
  "createdAt" TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SupportMessage_ticketId_createdAt_idx" ON "SupportMessage"("ticketId","createdAt");
