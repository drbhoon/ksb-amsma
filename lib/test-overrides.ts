/**
 * TEMPORARY testing overrides. Every one of these must be off before amsma.in
 * goes public - each is gated on an environment variable that simply must not
 * be set in production.
 */

/**
 * Extra addresses accepted as Proposer or Seconder during testing.
 *
 * Rule 4 requires both to be existing members, and the Register of Members is
 * empty while the Society is in formation, so only the 8 founding committee
 * members qualify. That makes it impossible for a tester to submit an
 * application from their own mailbox.
 *
 * These addresses are accepted for the proposer/seconder check ONLY. They are
 * deliberately NOT CommitteeMember rows: adding them would raise the approver
 * count to 10 and move the two-thirds quorum from 6 to 7, silently breaking the
 * Schedule C rule the whole review flow is built on.
 *
 * Set TEST_PROPOSER_EMAILS to a comma-separated list to enable. Unset it and
 * Rule 4 is enforced again, with no code change.
 */
export function testProposerEmails(): string[] {
  return (process.env.TEST_PROPOSER_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isTestProposerAllowed(email: string): boolean {
  const list = testProposerEmails();
  if (list.length === 0) return false;
  return list.includes(email.trim().toLowerCase());
}

/** True when any testing override is currently active. */
export function anyOverrideActive(): boolean {
  return testProposerEmails().length > 0;
}
