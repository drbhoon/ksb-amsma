/**
 * Membership categories & annual subscription fees.
 * Source: Schedule C, Rule 4.ii ("Admission Fee & Subscription")
 * of the Aggregate & M sand Manufacturers Association Rules & Regulations.
 *
 * ⚠ Do not modify fee amounts without a Managing Committee resolution
 *   passed by affirmative vote of two-thirds of its members.
 */

export type MembershipTierId =
  | 'ORDINARY_LARGE'
  | 'ORDINARY_REGULAR'
  | 'ASSOCIATE'
  | 'INSTITUTIONAL';

export interface MembershipTier {
  id: MembershipTierId;
  category: 'Ordinary' | 'Associate' | 'Institutional';
  label: string;
  eligibility: string;
  annualFeeRupees: number;      // Store INR for display
  annualFeePaise: number;       // Razorpay works in paise
  votingWeightage: 1 | 2;
  requiresCrushingCapacity: boolean;
  minCapacityMtMonth: number | null;
  allowsIndividuals: boolean;
}

export const MEMBERSHIP_TIERS: Record<MembershipTierId, MembershipTier> = {
  ORDINARY_LARGE: {
    id: 'ORDINARY_LARGE',
    category: 'Ordinary',
    label: 'Ordinary Member (Large Capacity)',
    eligibility: 'Aggregate business with total crushing capacity > 1 lakh MT/month',
    annualFeeRupees: 50000,
    annualFeePaise: 50000 * 100,
    votingWeightage: 2,
    requiresCrushingCapacity: true,
    minCapacityMtMonth: 100_000,
    allowsIndividuals: false,
  },
  ORDINARY_REGULAR: {
    id: 'ORDINARY_REGULAR',
    category: 'Ordinary',
    label: 'Ordinary Member',
    eligibility: 'Aggregate business with crushing capacity between 50,000 and 1 lakh MT/month',
    annualFeeRupees: 25000,
    annualFeePaise: 25000 * 100,
    votingWeightage: 1,
    requiresCrushingCapacity: true,
    minCapacityMtMonth: 50_000,
    allowsIndividuals: false,
  },
  ASSOCIATE: {
    id: 'ASSOCIATE',
    category: 'Associate',
    label: 'Associate Member',
    eligibility: 'Consultants, equipment suppliers (OEM), transporters, individuals connected with the industry',
    annualFeeRupees: 50000,
    annualFeePaise: 50000 * 100,
    votingWeightage: 1,
    requiresCrushingCapacity: false,
    minCapacityMtMonth: null,
    allowsIndividuals: true,
  },
  INSTITUTIONAL: {
    id: 'INSTITUTIONAL',
    category: 'Institutional',
    label: 'Institutional / Educational Member',
    eligibility: 'Research bodies, industry chambers, academic and educational institutions',
    annualFeeRupees: 35000,
    annualFeePaise: 35000 * 100,
    votingWeightage: 1,
    requiresCrushingCapacity: false,
    minCapacityMtMonth: null,
    allowsIndividuals: false,
  },
};

export const TIERS_LIST = Object.values(MEMBERSHIP_TIERS);

/** Format INR for display, e.g. formatInr(50000) → "₹50,000" */
export function formatInr(rupees: number): string {
  return '₹' + rupees.toLocaleString('en-IN');
}
