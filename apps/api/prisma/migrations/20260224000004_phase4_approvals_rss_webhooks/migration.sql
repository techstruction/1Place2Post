-- Phase 4: Post Approvals, RSS Campaigns, Outgoing Webhooks
-- Also: PENDING_APPROVAL to PostStatus; approvalRequestedAt/approvalDecidedAt on Post;
--        themeJson/contactJson/avatarMediaId on LinkPage

-- Add PENDING_APPROVAL to PostStatus enum
DO $$ BEGIN
  ALTER TYPE "PostStatus" ADD VALUE 'PENDING_APPROVAL';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ApprovalStatus enum
DO $$ BEGIN
  CREATE TYPE "ApprovalStatus" AS ENUM ('REQUESTED','APPROVED','REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add new columns to Post
ALTER TABLE "Post"
  ADD COLUMN IF NOT EXISTS "approvalRequestedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvalDecidedAt"   TIMESTAMP(3);

-- Add new columns to LinkPage
ALTER TABLE "LinkPage"
  ADD COLUMN IF NOT EXISTS "avatarMediaId" TEXT,
  ADD COLUMN IF NOT EXISTS "themeJson"     TEXT NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "contactJson"   TEXT NOT NULL DEFAULT '{}';

-- PostApproval
CREATE TABLE IF NOT EXISTS "PostApproval" (
  "id"             TEXT NOT NULL,
  "postId"         TEXT NOT NULL,
  "requestedById"  TEXT NOT NULL,
  "status"         "ApprovalStatus" NOT NULL DEFAULT 'REQUESTED',
  "requestedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedById"    TEXT,
  "decidedAt"      TIMESTAMP(3),
  "decisionReason" TEXT,
  CONSTRAINT "PostApproval_pkey"   PRIMARY KEY ("id"),
  CONSTRAINT "PostApproval_postId_key" UNIQUE ("postId"),
  CONSTRAINT "PostApproval_postId_fkey" FOREIGN KEY ("postId")        REFERENCES "Post"("id") ON DELETE CASCADE,
  CONSTRAINT "PostApproval_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE
);

-- RssCampaign
CREATE TABLE IF NOT EXISTS "RssCampaign" (
  "id"              TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "rssUrl"          TEXT NOT NULL,
  "template"        TEXT NOT NULL DEFAULT '{{title}} {{link}}',
  "socialAccountId" TEXT,
  "isActive"        BOOLEAN NOT NULL DEFAULT TRUE,
  "lastFetchedAt"   TIMESTAMP(3),
  "lastItemGuid"    TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RssCampaign_pkey"   PRIMARY KEY ("id"),
  CONSTRAINT "RssCampaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "RssCampaign_userId_idx" ON "RssCampaign"("userId");

-- OutgoingWebhook
CREATE TABLE IF NOT EXISTS "OutgoingWebhook" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "url"        TEXT NOT NULL,
  "secret"     TEXT,
  "eventsJson" TEXT NOT NULL DEFAULT '[]',
  "isActive"   BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OutgoingWebhook_pkey"   PRIMARY KEY ("id"),
  CONSTRAINT "OutgoingWebhook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
