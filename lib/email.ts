import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.FROM_EMAIL || 'AMSMA <noreply@amsma.org.in>';

export async function sendNewsletterWelcome(email: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email send');
    return { skipped: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Welcome to the AMSMA monthly briefing',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                     max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1d24;">
          <div style="border-bottom: 3px solid #d97b30; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="font-size: 24px; margin: 0; letter-spacing: -0.02em;">AMSMA</h1>
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em;
                       color: #6b7280; margin: 4px 0 0 0;">
              Aggregate Manufacturers &amp; Suppliers Members Association
            </p>
          </div>
          <h2 style="font-size: 22px; margin-bottom: 16px;">Welcome aboard.</h2>
          <p style="line-height: 1.6; font-size: 15px;">
            Thank you for subscribing to the AMSMA monthly briefing. You&apos;ll receive
            policy updates, technical papers, event announcements and industry data —
            curated by the AMSMA Secretariat.
          </p>
          <p style="line-height: 1.6; font-size: 15px;">
            Your first briefing will arrive on the first Monday of next month.
          </p>
          <p style="line-height: 1.6; font-size: 15px; color: #6b7280; margin-top: 40px;
                     border-top: 1px solid #e5e7eb; padding-top: 20px;">
            Didn&apos;t sign up? You can safely ignore this email — you won&apos;t receive
            anything further.
          </p>
        </body>
        </html>
      `,
    });

    if (error) throw error;
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[email] send failed', err);
    return { success: false, error: err };
  }
}
