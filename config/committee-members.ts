/**
 * AMSMA Founding Committee — single source of truth.
 *
 * Used by:
 *   - prisma/seed.ts        (creates committee rows and the portal allowlist)
 *   - app/(marketing)/page.tsx  (homepage committee cards)
 *   - app/(marketing)/committee/page.tsx (committee page, Phase 2)
 *
 * The eight email addresses below were approved by the user on 14 September 2026.
 * Do not replace them with older addresses recovered from another branch or file.
 * Email delivery remains controlled separately by the fail-safe settings in
 * lib/email.ts.
 */

export type CommitteeRole =
  | 'Founder Patron'
  | 'Founder President'
  | 'First President'
  | 'Vice President'
  | 'Secretary'
  | 'Treasurer'
  | 'Founder Member';

export interface CommitteeMember {
  slug: string;                 // URL slug for /committee/[slug] (Phase 2)
  initials: string;             // shown on placeholder card
  name: string;
  role: CommitteeRole;
  title: string;                // e.g. "Director, IIT Patna"
  email: string;                // server-only approved email address
  canApproveApplications: boolean; // set false to skip a member from approval quorum
}

export const COMMITTEE_MEMBERS: CommitteeMember[] = [
  {
    slug: 'trilok-nath-singh',
    initials: 'TN',
    name: 'Dr. Trilok Nath Singh',
    role: 'Founder Patron',
    title: 'Director, IIT Patna',
    email: 'tnsiitb@gmail.com',
    canApproveApplications: true,
  },
  {
    slug: 'ramesh-bhatawdekar',
    initials: 'RB',
    name: 'Dr. Ramesh M. Bhatawdekar',
    role: 'Founder President',
    title: 'Consultant, Aggregates & Mining',
    email: 'rmbhatawdekar@gmail.com',
    canApproveApplications: true,
  },
  {
    slug: 'susheel-kumar',
    initials: 'BK',
    name: 'Mr. B.R.V. Susheel Kumar',
    role: 'First President',
    title: 'Mines Department, Telangana',
    email: 'basavarajususheel@gmail.com',
    canApproveApplications: true,
  },
  {
    slug: 'karnail-singh-bhoon',
    initials: 'KB',
    name: 'Dr. Karnail Singh Bhoon',
    role: 'Vice President',
    title: 'COTO, RDC Concrete (India) Ltd.',
    email: 'ksbhoon@rdc.in',
    canApproveApplications: true,
  },
  {
    slug: 'anil-kumar-banchhor',
    initials: 'AB',
    name: 'Mr. Anil Kumar Banchhor',
    role: 'Founder Member',
    title: 'MD & CEO, RDC Concrete (I) Ltd.',
    email: 'anil@rdc.in',
    canApproveApplications: true,
  },
  {
    slug: 'rahul-ralegaonkar',
    initials: 'RR',
    name: 'Prof. Rahul V. Ralegaonkar',
    role: 'Founder Member',
    title: 'Professor, VNIT Nagpur',
    email: 'rvralegaonkar@civ.vnit.ac.in',
    canApproveApplications: true,
  },
  {
    slug: 'srikant-annavarapu',
    initials: 'SA',
    name: 'Mr. Srikant Annavarapu',
    role: 'Founder Member',
    title: 'MD, Master Geotech Services',
    email: 'mgsrikant@gmail.com',
    canApproveApplications: true,
  },
  {
    slug: 'rudra-mohan-sahu',
    initials: 'RS',
    name: 'Mr. Rudra Mohan Sahu',
    role: 'Secretary',
    title: 'Jagannath Stones',
    email: 'rudra.sahu@jagannathstones.com',
    canApproveApplications: true,
  },
];

/** Committee members eligible to vote on applications */
export const APPROVERS = COMMITTEE_MEMBERS.filter((m) => m.canApproveApplications);

/** Interim governance setting confirmed for testing: 5 approvals from 8. */
export const APPROVAL_QUORUM = 5;

/** Number of rejections that mathematically block approval */
export const REJECTION_THRESHOLD = APPROVERS.length - APPROVAL_QUORUM + 1;
