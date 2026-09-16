-- The site owner confirmed that every application and forum discussion to date
-- is test data. Keep committee/admin accounts and unrelated site content.
BEGIN;

DELETE FROM "ForumPost";
DELETE FROM "ForumTopic";

DELETE FROM "AuditEvent"
WHERE "applicationId" IS NOT NULL
   OR "event" = 'FORUM_MODERATION'
   OR "actorUserId" IN (
     SELECT "id" FROM "PortalUser" WHERE "role" = 'MEMBER'
   );

-- Member records and member portal accounts arose from test applications.
-- The memberId relation on PortalUser uses ON DELETE SET NULL.
DELETE FROM "Member";
DELETE FROM "MembershipApplication";
DELETE FROM "PortalUser" WHERE "role" = 'MEMBER';

COMMIT;
