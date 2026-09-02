/**
 * AMSMA Founding Committee — single source of truth.
 *
 * Used by:
 *   - prisma/seed.ts        (creates CommitteeMember rows for magic-link approvals)
 *   - app/(marketing)/page.tsx  (homepage committee cards)
 *   - app/(marketing)/committee/page.tsx (committee page, Phase 2)
 *
 * Temporary dummy addresses are used until verified committee addresses are
 * approved for the live review workflow.
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
  email: string;                // temporary dummy email until verified
  canApproveApplications: boolean; // set false to skip a member from approval quorum
}

export const COMMITTEE_MEMBERS: CommitteeMember[] = [
  {
    slug: 'trilok-nath-singh',
    initials: 'TN',
    name: 'Dr. Trilok Nath Singh',
    role: 'Founder Patron',
    title: 'Director, IIT Patna',
    email: 'trilok.nath.singh@example.com',
    canApproveApplications: true,
  },
  {
    slug: 'ramesh-bhatawdekar',
    initials: 'RB',
    name: 'Dr. Ramesh M. Bhatawdekar',
    role: 'Founder President',
    title: 'Consultant, Aggregates & Mining',
    email: 'ramesh.bhatawdekar@example.com',
    canApproveApplications: true,
  },
  {
    slug: 'susheel-kumar',
    initials: 'BK',
    name: 'Mr. B.R.V. Susheel Kumar',
    role: 'First President',
    title: 'Mines Department, Telangana',
    email: 'brv.susheel.kumar@example.com',
    canApproveApplications: true,
  },
  {
    slug: 'karnail-singh-bhoon',
    initials: 'KB',
    name: 'Dr. Karnail Singh Bhoon',
    role: 'Vice President',
    title: 'COTO, RDC Concrete (India) Ltd.',
    email: 'karnail.singh.bhoon@example.com',
    canApproveApplications: true,
  },
  {
    slug: 'anil-kumar-banchhor',
    initials: 'AB',
    name: 'Mr. Anil Kumar Banchhor',
    role: 'Founder Member',
    title: 'MD & CEO, RDC Concrete (I) Ltd.',
    email: 'anil.kumar.banchhor@example.com',
    canApproveApplications: true,
  },
  {
    slug: 'rahul-ralegaonkar',
    initials: 'RR',
    name: 'Prof. Rahul V. Ralegaonkar',
    role: 'Founder Member',
    title: 'Professor, VNIT Nagpur',
    email: 'rahul.ralegaonkar@example.com',
    canApproveApplications: true,
  },
  {
    slug: 'srikant-annavarapu',
    initials: 'SA',
    name: 'Mr. Srikant Annavarapu',
    role: 'Founder Member',
    title: 'MD, Master Geotech Services',
    email: 'srikant.annavarapu@example.com',
    canApproveApplications: true,
  },
  {
    slug: 'rudra-mohan-sahu',
    initials: 'RS',
    name: 'Mr. Rudra Mohan Sahu',
    role: 'Secretary',
    title: 'Jagannath Stones',
    email: 'rudra.mohan.sahu@example.com',
    canApproveApplications: true,
  },
];

/** Committee members eligible to vote on applications */
export const APPROVERS = COMMITTEE_MEMBERS.filter((m) => m.canApproveApplications);

/** 2/3 majority quorum, rounded up. For 8 members → 6. */
export const APPROVAL_QUORUM = Math.ceil((APPROVERS.length * 2) / 3);

/** Number of rejections that mathematically block approval */
export const REJECTION_THRESHOLD = APPROVERS.length - APPROVAL_QUORUM + 1;
