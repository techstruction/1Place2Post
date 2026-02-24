-- Phase 3: Media Assets, Templates, Analytics, Teams

-- EngagementMetric enum
DO $$ BEGIN
  CREATE TYPE "EngagementMetric" AS ENUM ('LIKES','VIEWS','COMMENTS','SHARES','CLICKS','FOLLOWERS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TeamRole enum
DO $$ BEGIN
  CREATE TYPE "TeamRole" AS ENUM ('OWNER','ADMIN','MEMBER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- MediaAsset
-- TODO: S3 migration — urlPath will become a signed S3/R2 URL beyond MVP.
CREATE TABLE IF NOT EXISTS "MediaAsset" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "filename"     TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType"     TEXT NOT NULL,
  "sizeBytes"    INTEGER NOT NULL,
  "urlPath"      TEXT NOT NULL,
  "tags"         TEXT[] NOT NULL DEFAULT '{}',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MediaAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Template
CREATE TABLE IF NOT EXISTS "Template" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "content"     TEXT NOT NULL,
  "hashtags"    TEXT[] NOT NULL DEFAULT '{}',
  "platform"    "Platform",
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Template_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- PostingSchedule
CREATE TABLE IF NOT EXISTS "PostingSchedule" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "platform"  "Platform" NOT NULL,
  "timezone"  TEXT NOT NULL DEFAULT 'UTC',
  "timesJson" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PostingSchedule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PostingSchedule_userId_platform_key" UNIQUE ("userId","platform"),
  CONSTRAINT "PostingSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- EngagementEvent
CREATE TABLE IF NOT EXISTS "EngagementEvent" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "platform"   "Platform" NOT NULL,
  "metric"     "EngagementMetric" NOT NULL,
  "value"      INTEGER NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EngagementEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EngagementEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "EngagementEvent_userId_occurredAt_idx" ON "EngagementEvent"("userId","occurredAt");

-- Team
CREATE TABLE IF NOT EXISTS "Team" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "ownerId"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- TeamMember
CREATE TABLE IF NOT EXISTS "TeamMember" (
  "id"        TEXT NOT NULL,
  "teamId"    TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "role"      "TeamRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TeamMember_teamId_userId_key" UNIQUE ("teamId","userId"),
  CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE,
  CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT,
  "teamId"     TEXT,
  "entityType" TEXT NOT NULL,
  "entityId"   TEXT,
  "action"     TEXT NOT NULL,
  "metaJson"   TEXT NOT NULL DEFAULT '{}',
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuditLog_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL
);
