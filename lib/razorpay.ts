import crypto from 'crypto';

/**
 * Razorpay integration.
 *
 * Docs: https://razorpay.com/docs/api/orders/
 *
 * Uses the raw REST API (not the SDK) to keep dependencies light —
 * Razorpay SDK is optional and adds ~10 packages we don't need for two endpoints.
 */

const RAZORPAY_API = 'https://api.razorpay.com/v1';

function auth() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }
  return 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
}

export interface CreateOrderInput {
  amountPaise: number;
  receipt: string;      // Our internal reference (application no)
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  entity: 'order';
  amount: number;
  currency: 'INR';
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
}

export async function createOrder(input: CreateOrderInput): Promise<RazorpayOrder> {
  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth(),
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: 'INR',
      receipt: input.receipt,
      notes: input.notes,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Razorpay createOrder failed: ${res.status} ${err}`);
  }
  return res.json();
}

/**
 * Verify the signature returned by Razorpay Checkout on the client
 * (razorpay_order_id, razorpay_payment_id, razorpay_signature).
 * HMAC-SHA256 of "orderId|paymentId" keyed by RAZORPAY_KEY_SECRET.
 */
export function verifyCheckoutSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(params.signature, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Verify a Razorpay webhook signature.
 * HMAC-SHA256 of the raw request body keyed by RAZORPAY_WEBHOOK_SECRET.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}
