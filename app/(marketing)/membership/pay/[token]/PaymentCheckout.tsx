'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Props {
  paymentToken: string;
  applicationNo: string;
  amountPaise: number;
  amountRupees: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  organizationName: string;
}

export function PaymentCheckout(props: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadRazorpay(): Promise<boolean> {
    if (window.Razorpay) return true;
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function pay() {
    setLoading(true);
    setError('');
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Failed to load payment provider. Please refresh and try again.');

      // Create Razorpay order via our API
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentToken: props.paymentToken }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Could not create order');

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: 'INR',
        order_id: orderData.orderId,
        name: 'AMSMA',
        description: `Annual subscription — ${props.applicationNo}`,
        prefill: {
          name: props.contactName,
          email: props.contactEmail,
          contact: props.contactPhone,
        },
        notes: {
          application_no: props.applicationNo,
          organization: props.organizationName,
        },
        theme: { color: '#d97b30' },
        handler: async (response: any) => {
          // Verify payment signature server-side
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentToken: props.paymentToken,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');
            router.push(`/membership/pay/success?no=${encodeURIComponent(props.applicationNo)}&m=${encodeURIComponent(verifyData.memberNo)}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed. Please contact secretary@amsma.in.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setError(`Payment failed: ${response.error?.description || 'Unknown error'}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initialisation failed');
      setLoading(false);
    }
  }

  return (
    <>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
      )}
      <button
        onClick={pay}
        disabled={loading}
        className="btn-accent w-full py-4 text-base disabled:opacity-50"
      >
        {loading ? 'Processing…' : `Pay ₹${props.amountRupees.toLocaleString('en-IN')} securely`}
      </button>
    </>
  );
}
