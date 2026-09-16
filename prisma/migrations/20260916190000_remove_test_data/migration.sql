-- Remove records explicitly marked as test data. Keep all unmarked records.
-- Fail closed if a test record has a real member reply or a real application link.
BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "ForumTopic" t
    JOIN "PortalUser" u ON u."id" = t."authorId"
    WHERE t."isTest" AND NOT u."isTest"
  ) THEN
    RAISE EXCEPTION 'Test-marked forum topic belongs to a real user. Manual review is required.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "ForumPost" p
    JOIN "ForumTopic" t ON t."id" = p."topicId"
    JOIN "PortalUser" author ON author."id" = p."authorId"
    WHERE (t."isTest" OR EXISTS (SELECT 1 FROM "PortalUser" u WHERE u."id" = t."authorId" AND u."isTest"))
      AND NOT author."isTest"
  ) THEN
    RAISE EXCEPTION 'Test-authored forum topic has a real user reply. Manual review is required.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "ApplicationReview" r
    JOIN "CommitteeMember" c ON c."id" = r."committeeMemberId"
    JOIN "MembershipApplication" a ON a."id" = r."applicationId"
    WHERE c."isTest" AND NOT a."isTest"
  ) THEN
    RAISE EXCEPTION 'Test committee account is linked to a real application. Manual review is required.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "PortalUser" u
    JOIN "CommitteeMember" c ON c."id" = u."committeeMemberId"
    WHERE c."isTest" AND NOT u."isTest"
  ) THEN
    RAISE EXCEPTION 'Test committee record is linked to a real portal account. Manual review is required.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "MembershipApplication" a
    JOIN "PortalUser" u ON u."id" = a."adminConfirmedById"
    WHERE NOT a."isTest" AND u."isTest"
  ) THEN
    RAISE EXCEPTION 'Test portal account confirmed a real application. Manual review is required.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "PortalUser" u
    JOIN "Member" m ON m."id" = u."memberId"
    JOIN "MembershipApplication" a ON a."id" = m."applicationId"
    WHERE u."isTest" AND NOT a."isTest"
  ) THEN
    RAISE EXCEPTION 'Test portal account is linked to a real member. Manual review is required.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "PortalUser" u
    JOIN "Member" m ON m."id" = u."memberId"
    JOIN "MembershipApplication" a ON a."id" = m."applicationId"
    WHERE NOT u."isTest" AND a."isTest"
  ) THEN
    RAISE EXCEPTION 'Real portal account is linked to a test member. Manual review is required.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "AuditEvent" e
    JOIN "PortalUser" u ON u."id" = e."actorUserId"
    JOIN "MembershipApplication" a ON a."id" = e."applicationId"
    WHERE u."isTest" AND NOT a."isTest"
  ) THEN
    RAISE EXCEPTION 'Test portal account has an audit record for a real application. Manual review is required.';
  END IF;
END $$;

DELETE FROM "AuditEvent"
WHERE "applicationId" IN (SELECT "id" FROM "MembershipApplication" WHERE "isTest")
   OR "actorUserId" IN (SELECT "id" FROM "PortalUser" WHERE "isTest")
   OR "event" LIKE 'TEST_DATA_RESET:%';

DELETE FROM "ForumPost"
WHERE "authorId" IN (SELECT "id" FROM "PortalUser" WHERE "isTest");

DELETE FROM "ForumTopic"
WHERE "isTest"
   OR "authorId" IN (SELECT "id" FROM "PortalUser" WHERE "isTest");

DELETE FROM "Member"
WHERE "applicationId" IN (SELECT "id" FROM "MembershipApplication" WHERE "isTest");

DELETE FROM "MembershipApplication" WHERE "isTest";
DELETE FROM "PortalUser" WHERE "isTest";
DELETE FROM "CommitteeMember" WHERE "isTest";

COMMIT;
