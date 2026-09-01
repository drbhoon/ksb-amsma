import Link from 'next/link';
import { MembershipApplicationForm } from '@/components/forms/MembershipApplicationForm';

export const metadata = { title: 'Apply for Membership' };

export default function ApplyPage() {
  return (
    <>
      <section className="membership-hero py-16 md:py-20">
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
            <MembershipApplicationForm />
          </div>
        </div>
      </section>
    </>
  );
}
