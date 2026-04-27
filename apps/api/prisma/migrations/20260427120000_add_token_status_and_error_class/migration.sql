/*
  Warnings:

  - The `status` column on the `PostPublishJob` table would be dropped and recreated. This will fail if there is data in the column.
  - The `type` column on the `Notification` table would be dropped and recreated. This will fail if there is data in the column.
  - Added the required column `tokenStatus` to the `SocialAccount` table without a default value. This will fail if there is data in the table.

*/
-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('ACTIVE', 'TOKEN_EXPIRING', 'TOKEN_CRITICAL', 'TOKEN_EXPIRED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "ErrorClass" AS ENUM ('PERMANENT', 'TRANSIENT', 'RATE_LIMIT', 'TOKEN_EXPIRED', 'PLATFORM_OUTAGE', 'UNKNOWN');

-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'VERIFY_FAILED' BEFORE 'FAILED';

-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'BLOCKED' AFTER 'CANCELLED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PUBLISH_BLOCKED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PUBLISH_VERIFY_FAILED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TOKEN_EXPIRING';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TOKEN_CRITICAL';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TOKEN_EXPIRED';

-- AlterTable
ALTER TABLE "SocialAccount" ADD COLUMN "tokenStatus" "TokenStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "PostPublishJob" ADD COLUMN "errorClass" "ErrorClass";
