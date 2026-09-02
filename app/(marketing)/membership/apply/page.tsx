import Link from 'next/link';
import { MembershipApplicationForm } from '@/components/forms/MembershipApplicationForm';
import { MEMBERSHIP_TIERS, type MembershipTierId } from '@/config/membership';

export const metadata = { title: 'Apply for Membership' };

export default function ApplyPage({ searchParams }: { searchParams: { tier?: string } }) {
  const initialTier = searchParams.tier && searchParams.tier in MEMBERSHIP_TIERS
    ? searchParams.tier as MembershipTierId
    : '';

  return (
    <>
      <section className="membership-hero membership-hero-strata py-12 md:py-14">
        <div className="container-x max-w-4xl">
          <Link href="/membership" className="membership-kicker hover:underline">← Back to Membership</Link>
          <h1 className="font-display font-bold text-3xl md:text-4xl leading-tight tracking-tight mt-4">
            Membership Application
          </h1>
          <p className="mt-3 text-white/80">
            Please provide the details below. Your application will be reviewed by the Managing Committee.
            Payment is collected only after approval.
          </p>
        </div>
      </section>

      <section className="membership-surface py-12 md:py-16">
        <div className="container-x max-w-3xl">
          <div className="membership-card p-5 sm:p-8 md:p-10">
            <MembershipApplicationForm initialTier={initialTier} />
          </div>
        </div>
      </section>
    </>
  );
}
