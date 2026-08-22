import Link from 'next/link';
import { MembershipApplicationForm } from '@/components/forms/MembershipApplicationForm';

export const metadata = { title: 'Apply for Membership' };

export default function ApplyPage() {
  return (
    <>
      <section className="bg-stone-900 text-white py-16">
        <div className="container-x max-w-4xl">
          <Link href="/membership" className="text-amber-light text-sm hover:underline">← Back to Membership</Link>
          <h1 className="font-display font-bold text-3xl md:text-4xl leading-tight tracking-tight mt-4">
            Membership Application
          </h1>
          <p className="mt-3 text-white/80">
            Please provide the details below. Your application will be reviewed by the Managing Committee.
            Payment is collected only after approval.
          </p>
        </div>
      </section>

      <section className="bg-stone-50 py-16">
        <div className="container-x max-w-3xl">
          <div className="bg-white p-8 md:p-10 rounded-xl border border-stone-100 shadow-sm">
            <MembershipApplicationForm />
          </div>
        </div>
      </section>
    </>
  );
}
