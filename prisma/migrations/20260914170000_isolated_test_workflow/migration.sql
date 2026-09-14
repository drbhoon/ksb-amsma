ALTER TABLE "CommitteeMember" ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MembershipApplication" ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "CommitteeMember_isTest_canApproveApplications_idx"
  ON "CommitteeMember"("isTest", "canApproveApplications");
CREATE INDEX "MembershipApplication_isTest_status_idx"
  ON "MembershipApplication"("isTest", "status");
