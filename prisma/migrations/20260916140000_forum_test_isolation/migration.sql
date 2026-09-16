ALTER TABLE "ForumTopic" ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;
DROP INDEX "ForumTopic_space_isHidden_updatedAt_idx";
CREATE INDEX "ForumTopic_isTest_space_isHidden_updatedAt_idx" ON "ForumTopic"("isTest", "space", "isHidden", "updatedAt");
