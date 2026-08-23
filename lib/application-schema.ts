import { z } from 'zod';
import { MEMBERSHIP_TIERS } from '@/config/membership';

/**
 * Membership application validation - the single source of truth.
 *
 * Imported by BOTH the client form and the submit endpoint, so the rules cannot
 * drift apart and the applicant sees exactly the message the server would give.
 * The form validates before it posts, which is what lets it show every problem
 * at once instead of one browser tooltip at a time.
 */

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/** Human-readable name for each field, used in the error summary. */
export const FIELD_LABELS: Record<string, string> = {
  tier: 'Membership category',
  organizationName: 'Organisation name',
  contactName: 'Contact person name',
  contactEmail: 'Contact email',
  contactPhone: 'Contact phone',
  addressLine: 'Registered address',
  city: 'City',
  state: 'State',
  pincode: 'PIN code',
  pan: 'PAN',
  gstNumber: 'GST number',
  crushingCapacityMtMonth: 'Crushing capacity',
  natureOfBusiness: 'Nature of business',
  signatoryName: 'Signatory name',
  signatoryDesignation: 'Signatory designation',
  signatoryEmail: 'Signatory email',
  signatoryPhone: 'Signatory phone',
  companyProofUrl: 'Document URL',
  companyProofType: 'Document type',
  proposerName: 'Proposer name',
  proposerEmail: 'Proposer email',
  seconderName: 'Seconder name',
  seconderEmail: 'Seconder email',
  agreeRules: 'Declaration',
};

/**
 * People type "www.rdc.in" or "drive.google.com/..." without a scheme, which is
 * a perfectly clear intention that `new URL()` rejects. Supply the scheme rather
 * than bouncing the applicant for a technicality.
 */
export function normalizeDocUrl(raw: string): string {
  const t = String(raw ?? '').trim();
  if (!t) return t;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

const trimmed = (v: unknown) => (typeof v === 'string' ? v.trim() : v);

export const applicationSchema = z
  .object({
    tier: z.enum(['ORDINARY_LARGE', 'ORDINARY_REGULAR', 'ASSOCIATE', 'INSTITUTIONAL'], {
      errorMap: () => ({ message: 'Choose a membership category in section 1.' }),
    }),

    organizationName: z.preprocess(trimmed, z.string()
      .min(2, 'Enter the full registered name of the organisation.')
      .max(200, 'Organisation name cannot exceed 200 characters.')),

    contactName: z.preprocess(trimmed, z.string()
      .min(2, 'Enter the contact person’s full name.')
      .max(120, 'Name cannot exceed 120 characters.')),

    contactEmail: z.preprocess(trimmed, z.string()
      .min(1, 'Contact email is required.')
      .email('Enter a valid email address, for example name@company.com.')
      .max(200, 'Email cannot exceed 200 characters.')),

    contactPhone: z.preprocess(trimmed, z.string()
      .min(6, 'Enter a contact phone number of at least 6 digits.')
      .max(20, 'Phone number cannot exceed 20 characters.')),

    addressLine: z.preprocess(trimmed, z.string()
      .min(5, 'Enter the registered office address.')
      .max(400, 'Address cannot exceed 400 characters.')),

    city: z.preprocess(trimmed, z.string()
      .min(2, 'Enter the city.')
      .max(80, 'City cannot exceed 80 characters.')),

    state: z.preprocess(trimmed, z.string()
      .min(2, 'Enter the state.')
      .max(80, 'State cannot exceed 80 characters.')),

    pincode: z.preprocess(trimmed, z.string()
      .regex(/^[0-9]{6}$/, 'PIN code must be exactly 6 digits, for example 411019.')),

    pan: z.preprocess(
      (v) => (typeof v === 'string' ? v.trim().toUpperCase() : v),
      z.string().regex(
        panRegex,
        'PAN must be 10 characters: five letters, four digits, then one letter — for example AABCD1234E.'
      )
    ),

    gstNumber: z.preprocess(trimmed, z.string()
      .max(15, 'GST number cannot exceed 15 characters.')
      .optional()
      .or(z.literal(''))),

    crushingCapacityMtMonth: z.preprocess(trimmed, z.string().optional().or(z.literal(''))),

    natureOfBusiness: z.preprocess(trimmed, z.string()
      .max(200, 'Nature of business cannot exceed 200 characters.')
      .optional()
      .or(z.literal(''))),

    signatoryName: z.preprocess(trimmed, z.string()
      .min(2, 'Enter the authorised signatory’s full name.')
      .max(120, 'Name cannot exceed 120 characters.')),

    signatoryDesignation: z.preprocess(trimmed, z.string()
      .min(2, 'Enter the signatory’s designation, for example Managing Director.')
      .max(120, 'Designation cannot exceed 120 characters.')),

    signatoryEmail: z.preprocess(trimmed, z.string()
      .min(1, 'Signatory email is required.')
      .email('Enter a valid email address for the signatory.')
      .max(200, 'Email cannot exceed 200 characters.')),

    signatoryPhone: z.preprocess(trimmed, z.string()
      .min(6, 'Enter a signatory phone number of at least 6 digits.')
      .max(20, 'Phone number cannot exceed 20 characters.')),

    companyProofUrl: z.preprocess(
      (v) => normalizeDocUrl(v as string),
      z.string()
        .min(1, 'Paste a link to your incorporation certificate, GST certificate or partnership deed.')
        .url('This does not look like a valid web link. Paste the full sharing link, for example https://drive.google.com/file/d/…')
        .max(500, 'Link cannot exceed 500 characters.')
    ),

    companyProofType: z.enum(['incorporation', 'gst_cert', 'partnership_deed'], {
      errorMap: () => ({ message: 'Choose which document you are linking to.' }),
    }),

    proposerName: z.preprocess(trimmed, z.string()
      .min(2, 'Enter the proposer’s name.')
      .max(120, 'Name cannot exceed 120 characters.')),

    proposerEmail: z.preprocess(trimmed, z.string()
      .min(1, 'Proposer email is required.')
      .email('Enter a valid email address for the proposer.')
      .max(200, 'Email cannot exceed 200 characters.')),

    seconderName: z.preprocess(trimmed, z.string()
      .min(2, 'Enter the seconder’s name.')
      .max(120, 'Name cannot exceed 120 characters.')),

    seconderEmail: z.preprocess(trimmed, z.string()
      .min(1, 'Seconder email is required.')
      .email('Enter a valid email address for the seconder.')
      .max(200, 'Email cannot exceed 200 characters.')),

    agreeRules: z.literal(true, {
      errorMap: () => ({
        message: 'You must accept the Memorandum and Rules & Regulations to apply.',
      }),
    }),
  })
  .superRefine((d, ctx) => {
    const tier = MEMBERSHIP_TIERS[d.tier as keyof typeof MEMBERSHIP_TIERS];

    // Ordinary membership is capacity-gated, and the two Ordinary bands are
    // determined by capacity - so a mismatch is a real error, not a preference.
    if (tier?.requiresCrushingCapacity) {
      const raw = (d.crushingCapacityMtMonth || '') as string;
      const capacity = parseInt(raw, 10);

      if (!raw || Number.isNaN(capacity)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['crushingCapacityMtMonth'],
          message: 'Ordinary Members must declare their crushing capacity in MT per month.',
        });
      } else if (capacity < 50_000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['crushingCapacityMtMonth'],
          message: `Ordinary membership requires at least 50,000 MT/month. You entered ${capacity.toLocaleString('en-IN')}. Organisations below this threshold may apply as Associate Members.`,
        });
      } else {
        const correct =
          capacity >= 100_000 ? MEMBERSHIP_TIERS.ORDINARY_LARGE : MEMBERSHIP_TIERS.ORDINARY_REGULAR;
        if (correct.id !== d.tier) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['tier'],
            message: `A capacity of ${capacity.toLocaleString('en-IN')} MT/month qualifies for "${correct.label}". Please select that category in section 1.`,
          });
        }
      }
    }

    // Associate and Institutional applicants describe their business instead.
    if (tier && !tier.requiresCrushingCapacity && !d.natureOfBusiness) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['natureOfBusiness'],
        message: 'Describe the nature of your business or institution.',
      });
    }

    if (
      d.proposerEmail &&
      d.seconderEmail &&
      String(d.proposerEmail).toLowerCase() === String(d.seconderEmail).toLowerCase()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['seconderEmail'],
        message: 'The proposer and seconder must be two different committee members.',
      });
    }
  });

export type ApplicationInput = z.infer<typeof applicationSchema>;

/** Collapse a ZodError into one message per field, in form order. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
