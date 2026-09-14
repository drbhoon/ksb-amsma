CREATE TABLE "PortalLoginChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "returnPath" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PortalLoginChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortalLoginChallenge_tokenHash_key"
  ON "PortalLoginChallenge"("tokenHash");
CREATE INDEX "PortalLoginChallenge_email_createdAt_idx"
  ON "PortalLoginChallenge"("email", "createdAt");
CREATE INDEX "PortalLoginChallenge_expiresAt_idx"
  ON "PortalLoginChallenge"("expiresAt");

ALTER TABLE "PortalLoginChallenge" ADD CONSTRAINT "PortalLoginChallenge_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "PortalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
