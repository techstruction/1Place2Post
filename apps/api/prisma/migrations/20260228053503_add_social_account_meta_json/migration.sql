-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_teamId_fkey";

-- DropForeignKey
ALTER TABLE "BotRule" DROP CONSTRAINT "BotRule_userId_fkey";

-- DropForeignKey
ALTER TABLE "EngagementEvent" DROP CONSTRAINT "EngagementEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "LinkClick" DROP CONSTRAINT "LinkClick_linkItemId_fkey";

-- DropForeignKey
ALTER TABLE "LinkClick" DROP CONSTRAINT "LinkClick_linkPageId_fkey";

-- DropForeignKey
ALTER TABLE "LinkItem" DROP CONSTRAINT "LinkItem_linkPageId_fkey";

-- DropForeignKey
ALTER TABLE "LinkPage" DROP CONSTRAINT "LinkPage_userId_fkey";

-- DropForeignKey
ALTER TABLE "MediaAsset" DROP CONSTRAINT "MediaAsset_userId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "OutgoingWebhook" DROP CONSTRAINT "OutgoingWebhook_userId_fkey";

-- DropForeignKey
ALTER TABLE "PostApproval" DROP CONSTRAINT "PostApproval_postId_fkey";

-- DropForeignKey
ALTER TABLE "PostApproval" DROP CONSTRAINT "PostApproval_requestedById_fkey";

-- DropForeignKey
ALTER TABLE "PostLog" DROP CONSTRAINT "PostLog_postId_fkey";

-- DropForeignKey
ALTER TABLE "PostPublishJob" DROP CONSTRAINT "PostPublishJob_postId_fkey";

-- DropForeignKey
ALTER TABLE "PostingSchedule" DROP CONSTRAINT "PostingSchedule_userId_fkey";

-- DropForeignKey
ALTER TABLE "RssCampaign" DROP CONSTRAINT "RssCampaign_userId_fkey";

-- DropForeignKey
ALTER TABLE "Series" DROP CONSTRAINT "Series_userId_fkey";

-- DropForeignKey
ALTER TABLE "SupportMessage" DROP CONSTRAINT "SupportMessage_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_userId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_teamId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_userId_fkey";

-- DropIndex
DROP INDEX "EngagementEvent_userId_occurredAt_idx";

-- DropIndex
DROP INDEX "RssCampaign_userId_idx";

-- AlterTable
ALTER TABLE "MediaAsset" ALTER COLUMN "tags" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SocialAccount" ADD COLUMN     "metaJson" TEXT NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Template" ALTER COLUMN "hashtags" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkPage" ADD CONSTRAINT "LinkPage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkItem" ADD CONSTRAINT "LinkItem_linkPageId_fkey" FOREIGN KEY ("linkPageId") REFERENCES "LinkPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkClick" ADD CONSTRAINT "LinkClick_linkPageId_fkey" FOREIGN KEY ("linkPageId") REFERENCES "LinkPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkClick" ADD CONSTRAINT "LinkClick_linkItemId_fkey" FOREIGN KEY ("linkItemId") REFERENCES "LinkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotRule" ADD CONSTRAINT "BotRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingSchedule" ADD CONSTRAINT "PostingSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementEvent" ADD CONSTRAINT "EngagementEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostApproval" ADD CONSTRAINT "PostApproval_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostApproval" ADD CONSTRAINT "PostApproval_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RssCampaign" ADD CONSTRAINT "RssCampaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutgoingWebhook" ADD CONSTRAINT "OutgoingWebhook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostPublishJob" ADD CONSTRAINT "PostPublishJob_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLog" ADD CONSTRAINT "PostLog_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
