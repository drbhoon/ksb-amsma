ALTER TYPE "PortalRole" ADD VALUE IF NOT EXISTS 'MEMBER';

ALTER TABLE "PortalUser" ADD COLUMN "memberId" TEXT;
CREATE UNIQUE INDEX "PortalUser_memberId_key" ON "PortalUser"("memberId");
ALTER TABLE "PortalUser" ADD CONSTRAINT "PortalUser_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "ForumSpace" AS ENUM ('MEMBERS', 'COMMITTEE');

CREATE TABLE "ForumTopic" (
  "id" TEXT NOT NULL,
  "space" "ForumSpace" NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "authorId" TEXT NOT NULL,
  "isClosed" BOOLEAN NOT NULL DEFAULT false,
  "isHidden" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ForumTopic_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ForumTopic_space_isHidden_updatedAt_idx" ON "ForumTopic"("space", "isHidden", "updatedAt");
CREATE INDEX "ForumTopic_authorId_createdAt_idx" ON "ForumTopic"("authorId", "createdAt");
ALTER TABLE "ForumTopic" ADD CONSTRAINT "ForumTopic_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "PortalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ForumPost" (
  "id" TEXT NOT NULL,
  "topicId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "isHidden" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ForumPost_topicId_isHidden_createdAt_idx" ON "ForumPost"("topicId", "isHidden", "createdAt");
CREATE INDEX "ForumPost_authorId_createdAt_idx" ON "ForumPost"("authorId", "createdAt");
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "ForumTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "PortalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
