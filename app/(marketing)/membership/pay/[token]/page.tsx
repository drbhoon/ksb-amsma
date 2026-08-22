import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { MEMBERSHIP_TIERS, formatInr } from '@/config/membership';
import { PaymentCheckout } from './PaymentCheckout';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Complete Payment' };

type Props = { params: { token: string } };

export default async function PaymentPage({ params }: Props) {
  const app = await prisma.membershipApplication.findUnique({
    where: { paymentToken: params.token },
  });

  if (!app) notFound();

  const tier = MEMBERSHIP_TIERS[app.tier];
  const now = new Date();

  if (app.status === 'ACTIVE') {
    return <Status heading="Payment already received" body="Your membership is active. Thank you." />;
  }
  if (app.status === 'REJECTED') {
    return <Status heading="Application not approved" body="This application was not approved by the Managing Committee." />;
  }
  if (app.status !== 'PAYMENT_PENDING') {
    return <Status heading="Payment not yet available" body="This application has not yet been approved by the committee." />;
  }
  if (app.paymentExpiresAt && app.paymentExpiresAt < now) {
    return (
      <Status
        heading="Payment link expired"
        body={`This payment link expired on ${app.paymentExpiresAt.toLocaleDateString('en-IN')}. Please contact the Secretariat at secretary@amsma.in to request a new link.`}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-16">
      <div className="container-x max-w-2xl">
        <div className="bg-white rounded-xl overflow-hidden border border-stone-100 shadow-sm">
          <div className="bg-stone-900 text-white p-8">
            <div className="text-xs uppercase tracking-[0.12em] text-amber-light mb-2">Application Approved</div>
            <h1 className="font-display font-bold text-3xl tracking-tight">Complete Payment</h1>
            <p className="text-white/80 mt-2 text-sm">
              Your application <strong>{app.applicationNo}</strong> has been approved by the Managing Committee.
              Please complete the annual subscription payment to activate membership.
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <Detail k="Organisation" v={app.organizationName} />
              <Detail k="Category" v={tier.label} />
              <Detail k="Application No." v={app.applicationNo} />
              <Detail k="PAN" v={app.pan} />
            </div>

            <div className="bg-stone-50 rounded-lg p-6 flex items-baseline justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.1em] text-stone-500">Amount Payable</div>
                <div className="text-sm text-stone-600 mt-1">Annual subscription — {tier.category}</div>
              </div>
              <div className="font-display font-bold text-3xl">{formatInr(tier.annualFeeRupees)}</div>
            </div>

            <PaymentCheckout
              paymentToken={params.token}
              applicationNo={app.applicationNo}
              amountPaise={app.annualFeePaise}
              amountRupees={tier.annualFeeRupees}
              contactName={app.contactName}
              contactEmail={app.contactEmail}
              contactPhone={app.contactPhone}
              organizationName={app.organizationName}
            />

            <p className="text-xs text-stone-500 text-center">
              Payment link valid until {app.paymentExpiresAt?.toLocaleDateString('en-IN')} · Secure processing by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.1em] text-stone-500">{k}</div>
      <div className="text-sm font-medium text-stone-900 mt-1">{v}</div>
    </div>
  );
}

function Status({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-16">
      <div className="container-x max-w-lg text-center">
        <h1 className="font-display font-bold text-3xl tracking-tight mb-4">{heading}</h1>
        <p className="text-stone-700">{body}</p>
      </div>
    </div>
  );
}
