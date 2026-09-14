-- Add staged review states. Legacy values remain valid for existing records.
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'SPONSOR_REVIEW';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'COMMITTEE_REVIEW';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'PAUSED_NO_QUORUM';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'ADMIN_REVIEW';

CREATE TYPE "CommitteeResult" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NO_QUORUM');
CREATE TYPE "ReviewPhase" AS ENUM ('SPONSOR', 'COMMITTEE');
CREATE TYPE "PortalRole" AS ENUM ('COMMITTEE', 'ADMIN');

ALTER TABLE "MembershipApplication"
  ADD COLUMN "sponsorReviewDeadlineAt" TIMESTAMP(3),
  ADD COLUMN "committeeReviewStartedAt" TIMESTAMP(3),
  ADD COLUMN "committeeReviewDeadlineAt" TIMESTAMP(3),
  ADD COLUMN "committeeResult" "CommitteeResult" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "adminConfirmedAt" TIMESTAMP(3),
  ADD COLUMN "adminConfirmedById" TEXT,
  ADD COLUMN "adminNote" TEXT;

ALTER TABLE "ApplicationReview"
  ADD COLUMN "phase" "ReviewPhase" NOT NULL DEFAULT 'COMMITTEE';

CREATE TABLE "PortalUser" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT,
  "role" "PortalRole" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "committeeMemberId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastLoginAt" TIMESTAMP(3),
  CONSTRAINT "PortalUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortalSession" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PortalSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT,
  "actorUserId" TEXT,
  "event" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortalUser_email_key" ON "PortalUser"("email");
CREATE UNIQUE INDEX "PortalUser_committeeMemberId_key" ON "PortalUser"("committeeMemberId");
CREATE INDEX "PortalUser_role_active_idx" ON "PortalUser"("role", "active");
CREATE UNIQUE INDEX "PortalSession_tokenHash_key" ON "PortalSession"("tokenHash");
CREATE INDEX "PortalSession_userId_idx" ON "PortalSession"("userId");
CREATE INDEX "PortalSession_expiresAt_idx" ON "PortalSession"("expiresAt");
CREATE INDEX "AuditEvent_applicationId_createdAt_idx" ON "AuditEvent"("applicationId", "createdAt");
CREATE INDEX "AuditEvent_actorUserId_createdAt_idx" ON "AuditEvent"("actorUserId", "createdAt");

ALTER TABLE "PortalUser" ADD CONSTRAINT "PortalUser_committeeMemberId_fkey"
  FOREIGN KEY ("committeeMemberId") REFERENCES "CommitteeMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PortalSession" ADD CONSTRAINT "PortalSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "PortalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "PortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MembershipApplication" ADD CONSTRAINT "MembershipApplication_adminConfirmedById_fkey"
  FOREIGN KEY ("adminConfirmedById") REFERENCES "PortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
