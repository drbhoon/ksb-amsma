import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendContactMessage } from '@/lib/email';

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(30).optional().default(''),
  subject: z.string().trim().min(3).max(140),
  message: z.string().trim().min(20).max(4000),
  consent: z.literal(true),
  website: z.string().max(200).optional().default(''),
});

export async function POST(request: Request) {
  try {
    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please check the form and try again.' }, { status: 400 });
    }
    if (parsed.data.website) return NextResponse.json({ ok: true });

    const result = await sendContactMessage(parsed.data);
    if ('success' in result && result.success === false) {
      return NextResponse.json({ error: 'The message could not be sent. Please email info@amsma.in.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[contact] submission failed', error);
    return NextResponse.json({ error: 'The message could not be sent. Please email info@amsma.in.' }, { status: 500 });
  }
}
