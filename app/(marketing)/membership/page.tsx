import Link from 'next/link';
import { TIERS_LIST, formatInr } from '@/config/membership';

export const metadata = {
  title: 'Membership',
  description: 'Membership categories, eligibility, and annual subscription fees.',
};

export default function MembershipPage() {
  return (
    <>
      {/* Header */}
      <section className="membership-hero py-20">
        <div className="container-x max-w-4xl">
          <span className="inline-block text-sm font-semibold uppercase tracking-[0.12em] text-amber-light
                           pl-12 relative before:content-[''] before:absolute before:left-0 before:top-1/2
                           before:w-8 before:h-[2px] before:bg-amber-light">Membership</span>
          <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight tracking-tight mt-4">
            Join a community shaping India&apos;s aggregate industry.
          </h1>
          <p className="mt-5 text-lg text-white/80 max-w-2xl">
            Membership is open to businesses, institutions and individuals engaged in the aggregate and M sand industry.
            Fees and eligibility are governed by Rule 4 of the Association&apos;s Rules &amp; Regulations.
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section className="membership-surface py-20">
        <div className="container-x">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {TIERS_LIST.map((tier) => (
              <div
                key={tier.id}
                className="membership-card p-8 flex flex-col"
              >
                <div className="text-xs text-amber font-semibold uppercase tracking-[0.1em] mb-2">
                  {tier.category}
                </div>
                <h3 className="font-display font-semibold text-2xl leading-tight mb-4 tracking-tight">
                  {tier.label}
                </h3>
                <p className="text-stone-700 mb-6 text-[0.95rem] leading-relaxed">
                  {tier.eligibility}
                </p>
                <div className="border-t border-stone-100 pt-6 mt-auto">
                  <div className="text-xs uppercase tracking-[0.1em] text-stone-500 mb-1">
                    Annual Subscription
                  </div>
                  <div className="font-display font-bold text-3xl">
                    {formatInr(tier.annualFeeRupees)}
                    <span className="text-sm font-normal text-stone-500 ml-2">/ year</span>
                  </div>
                  <div className="text-xs text-stone-500 mt-3">
                    Voting weightage: {tier.votingWeightage} · {tier.allowsIndividuals ? 'Individuals eligible' : 'Corporate bodies only'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto mt-12 text-center">
            <Link href="/membership/apply" className="btn-accent inline-flex px-8 py-4 text-base">
              Apply for Membership
            </Link>
            <p className="text-sm text-stone-500 mt-6">
              Applications are reviewed by the Managing Committee. As per the Rules, admission requires a 2/3 majority approval.
              Payment is collected only after approval.
            </p>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="bg-[#fbf8f0] py-20">
        <div className="container-x max-w-4xl">
          <span className="section-eyebrow">How it Works</span>
          <h2 className="section-title mt-4 mb-12">Four steps from application to active membership.</h2>
          <div className="space-y-8">
            <Step num="1" title="Submit application">
              Complete the online application, including your organisation details, authorised
              signatory, and the names of two existing members as proposer and seconder.
            </Step>
            <Step num="2" title="Committee review">
              Each committee member receives your application via a secure link. Per the Rules,
              admission requires the approval of two-thirds of the Managing Committee (6 of 8 members).
            </Step>
            <Step num="3" title="Payment on approval">
              Once approved, you will receive a payment link for the annual subscription fee.
              The link is valid for 14 days. Payment is processed securely via Razorpay.
            </Step>
            <Step num="4" title="Active membership">
              On successful payment, your organisation is entered in the Register of Members
              and you receive your member number, welcome pack, and access to member benefits.
            </Step>
          </div>
        </div>
      </section>
    </>
  );
}

function Step({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-6">
      <div className="flex-shrink-0 w-12 h-12 bg-amber text-white flex items-center justify-center font-display font-bold text-lg">
        {num}
      </div>
      <div>
        <h3 className="font-display font-semibold text-xl mb-2">{title}</h3>
        <p className="prose-body">{children}</p>
      </div>
    </div>
  );
}
