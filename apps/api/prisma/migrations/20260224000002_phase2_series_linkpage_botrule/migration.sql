-- Phase 2: Series, LinkPage, LinkItem, LinkClick, BotRule

-- Add ARCHIVED to PostStatus enum
ALTER TYPE "PostStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

-- BotMatchType enum
DO $$ BEGIN
  CREATE TYPE "BotMatchType" AS ENUM ('CONTAINS', 'REGEX', 'ANY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Series
CREATE TABLE IF NOT EXISTS "Series" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "cadence"     TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Series_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Series_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- LinkPage
CREATE TABLE IF NOT EXISTS "LinkPage" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "bio"       TEXT,
  "avatarUrl" TEXT,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LinkPage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LinkPage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "LinkPage_slug_key" ON "LinkPage"("slug");

-- LinkItem
CREATE TABLE IF NOT EXISTS "LinkItem" (
  "id"         TEXT NOT NULL,
  "linkPageId" TEXT NOT NULL,
  "label"      TEXT NOT NULL,
  "url"        TEXT NOT NULL,
  "sortOrder"  INTEGER NOT NULL DEFAULT 0,
  "active"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LinkItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LinkItem_linkPageId_fkey" FOREIGN KEY ("linkPageId") REFERENCES "LinkPage"("id") ON DELETE CASCADE
);

-- LinkClick
CREATE TABLE IF NOT EXISTS "LinkClick" (
  "id"         TEXT NOT NULL,
  "linkPageId" TEXT NOT NULL,
  "linkItemId" TEXT,
  "clickedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipHash"     TEXT,
  CONSTRAINT "LinkClick_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LinkClick_linkPageId_fkey" FOREIGN KEY ("linkPageId") REFERENCES "LinkPage"("id") ON DELETE CASCADE,
  CONSTRAINT "LinkClick_linkItemId_fkey" FOREIGN KEY ("linkItemId") REFERENCES "LinkItem"("id") ON DELETE SET NULL
);

-- BotRule
CREATE TABLE IF NOT EXISTS "BotRule" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "matchType"  "BotMatchType" NOT NULL DEFAULT 'CONTAINS',
  "matchValue" TEXT NOT NULL,
  "replyText"  TEXT NOT NULL,
  "webhookUrl" TEXT,
  "active"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BotRule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BotRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
