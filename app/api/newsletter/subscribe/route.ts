import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendNewsletterWelcome } from '@/lib/email';

const schema = z.object({
  email: z.string().email('Please enter a valid email address').max(254),
  name:  z.string().max(120).optional(),
  source: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { email, name, source } = parsed.data;
    const normalisedEmail = email.toLowerCase().trim();

    // Upsert — re-subscribe if previously unsubscribed
    await prisma.newsletterSubscriber.upsert({
      where: { email: normalisedEmail },
      update: { unsubscribedAt: null, name: name ?? undefined },
      create: { email: normalisedEmail, name, source: source ?? 'homepage' },
    });

    // Fire and forget — don't block the response on email delivery
    sendNewsletterWelcome(normalisedEmail).catch((e) =>
      console.error('[newsletter] welcome email failed', e)
    );

    return NextResponse.json({
      success: true,
      message: 'Subscribed! Check your inbox for a welcome message.',
    });
  } catch (err) {
    console.error('[newsletter/subscribe]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
