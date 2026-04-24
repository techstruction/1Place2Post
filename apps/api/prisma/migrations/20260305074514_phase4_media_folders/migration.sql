/*
  Warnings:

  - You are about to drop the column `mediaFileId` on the `PostMedia` table. All the data in the column will be lost.
  - You are about to drop the `MediaFile` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[postId,mediaAssetId]` on the table `PostMedia` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mediaAssetId` to the `PostMedia` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MediaFile" DROP CONSTRAINT "MediaFile_userId_fkey";

-- DropForeignKey
ALTER TABLE "PostMedia" DROP CONSTRAINT "PostMedia_mediaFileId_fkey";

-- DropIndex
DROP INDEX "PostMedia_postId_mediaFileId_key";

-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "folder" TEXT DEFAULT 'root';

-- AlterTable
ALTER TABLE "PostMedia" DROP COLUMN "mediaFileId",
ADD COLUMN     "mediaAssetId" TEXT NOT NULL;

-- DropTable
DROP TABLE "MediaFile";

-- CreateIndex
CREATE UNIQUE INDEX "PostMedia_postId_mediaAssetId_key" ON "PostMedia"("postId", "mediaAssetId");

-- AddForeignKey
ALTER TABLE "PostMedia" ADD CONSTRAINT "PostMedia_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
