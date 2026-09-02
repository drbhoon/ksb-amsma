import { Resend } from 'resend';
import nodemailer, { type Transporter } from 'nodemailer';
import { siteUrl } from './site-url';

/**
 * Sender address.
 *
 * Gmail will not let you send as an arbitrary address: it rewrites From to the
 * authenticated account unless the address is a verified alias. So when the
 * Gmail transport is active the account address wins over FROM_EMAIL, rather
 * than us pretending to send as noreply@amsma.in and having Gmail silently
 * change it.
 */
/**
 * Where replies go.
 *
 * Mail is sent from noreply@amsma.in, an address that will never have a
 * mailbox: verifying a domain with Resend proves ownership for SENDING and
 * creates nothing to receive with. Without a Reply-To, a committee member who
 * hits Reply on a review invitation gets a bounce. Point replies at a mailbox
 * that actually exists.
 */
function replyToAddress(): string | undefined {
  return process.env.REPLY_TO || process.env.GMAIL_USER || undefined;
}

function fromAddress(): string {
  const gmailUser = process.env.GMAIL_USER;
  if (gmailUser && process.env.GMAIL_APP_PASSWORD) {
    return process.env.FROM_NAME
      ? `${process.env.FROM_NAME} <${gmailUser}>`
      : `AMSMA <${gmailUser}>`;
  }
  return process.env.FROM_EMAIL || 'AMSMA <noreply@amsma.in>';
}
const SITE = siteUrl();

// Lazy singleton — don't instantiate at module load (breaks Next.js build
// when RESEND_API_KEY is absent at build time)
let _resend: Resend | null = null;
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

let _gmail: Transporter | null = null;
function getGmail(): Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  if (!_gmail) {
    _gmail = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      // Google prints App Passwords with spaces for readability; SMTP expects
      // them without. Strip whitespace so a pasted value just works.
      auth: { user, pass: pass.replace(/\s+/g, '') },
    });
  }
  return _gmail;
}

export type EmailProvider = 'gmail' | 'resend' | 'none';

/**
 * Which transport will actually carry the mail. Gmail wins when configured:
 * it needs no verified domain, which is what the Association requires until
 * amsma.in has DNS. Resend takes over once the domain is live.
 */
export function emailProvider(): EmailProvider {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return 'gmail';
  if (process.env.RESEND_API_KEY) return 'resend';
  return 'none';
}

// ---------- Shared HTML wrapper ----------

function wrap(bodyHtml: string, previewText = ''): string {
  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"><title>AMSMA</title></head>
  <body style="margin:0;padding:0;background:#faf9f6;">
    <div style="display:none;font-size:0;line-height:0;">${previewText}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f6;padding:40px 20px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:8px;overflow:hidden;
                      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1d24;">
          <tr><td style="padding:32px 40px 24px;border-bottom:3px solid #d97b30;">
            <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;">AMSMA</div>
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#6b7280;margin-top:4px;">
              Aggregate &amp; M sand Manufacturers Association
            </div>
          </td></tr>
          <tr><td style="padding:32px 40px;line-height:1.6;font-size:15px;">${bodyHtml}</td></tr>
          <tr><td style="padding:24px 40px;background:#faf9f6;border-top:1px solid #eee;
                            font-size:12px;color:#6b7280;line-height:1.5;">
            Registered under Societies Registration Act, 1860 (Maharashtra)<br>
            <a href="${SITE}" style="color:#d97b30;text-decoration:none;">${SITE.replace(/^https?:\/\//, '')}</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string, variant: 'primary' | 'danger' = 'primary'): string {
  const bg = variant === 'danger' ? '#a54a2a' : '#d97b30';
  return `<a href="${href}" style="display:inline-block;background:${bg};color:#ffffff;
          text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;
          font-size:14px;">${label}</a>`;
}

/**
 * Delivery mode — fail-safe by design.
 *
 * `config/committee-members.ts` holds the configured committee addresses. These
 * are temporary dummy addresses until verified addresses are approved. Outbound
 * mail stays OFF unless it is explicitly switched on:
 *
 *   EMAIL_REDIRECT_TO="a@x.com,b@y.com"  → every message goes to these addresses
 *                                          instead of the real recipient, with the
 *                                          intended recipient shown in the subject.
 *                                          This is the mode for Railway testing.
 *   EMAIL_LIVE=true                      → real delivery to real recipients.
 *                                          Production only.
 *   neither                              → nothing is sent; each attempt is logged.
 *
 * If both are set, EMAIL_REDIRECT_TO wins — the safer of the two.
 */
type EmailMode = 'redirect' | 'live' | 'off';

function redirectTargets(): string[] {
  return (process.env.EMAIL_REDIRECT_TO || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function emailMode(): EmailMode {
  if (redirectTargets().length > 0) return 'redirect';
  if (process.env.EMAIL_LIVE === 'true') return 'live';
  return 'off';
}

async function send(to: string, subject: string, html: string) {
  const mode = emailMode();

  if (mode === 'off') {
    console.warn(
      `[email] BLOCKED (mode=off) -> "${to}" - ${subject}
` +
        '        Set EMAIL_REDIRECT_TO to test, or EMAIL_LIVE=true for real delivery.'
    );
    return { skipped: true, reason: 'mode-off' as const };
  }

  const provider = emailProvider();
  if (provider === 'none') {
    console.warn(
      `[email] NO PROVIDER configured -> "${to}" - ${subject}
` +
        '        Set GMAIL_USER + GMAIL_APP_PASSWORD, or RESEND_API_KEY.'
    );
    return { skipped: true, reason: 'no-provider' as const };
  }

  // In redirect mode the true recipient is preserved in the subject so testers
  // can tell which committee member's magic link they are looking at.
  const recipients = mode === 'redirect' ? redirectTargets() : [to];
  const finalSubject = mode === 'redirect' ? `[-> ${to}] ${subject}` : subject;
  const from = fromAddress();

  try {
    if (provider === 'gmail') {
      const transporter = getGmail()!;
      const info = await transporter.sendMail({
        from,
        to: recipients.join(', '),
        replyTo: replyToAddress(),
        subject: finalSubject,
        html,
      });
      if (mode === 'redirect') {
        console.log(`[email] gmail: redirected "${to}" -> ${recipients.join(', ')} - ${subject}`);
      }
      return { success: true, id: info.messageId, provider };
    }

    const client = getResend()!;
    const replyTo = replyToAddress();
    const { data, error } = await client.emails.send({
      from,
      to: recipients,
      ...(replyTo ? { replyTo } : {}),
      subject: finalSubject,
      html,
    });
    if (error) throw error;
    if (mode === 'redirect') {
      console.log(`[email] resend: redirected "${to}" -> ${recipients.join(', ')} - ${subject}`);
    }
    return { success: true, id: data?.id, provider };
  } catch (err) {
    console.error(`[email] send failed via ${provider}`, { to, subject, err });
    return { success: false, error: err, provider };
  }
}

/** Send a throwaway message to confirm the transport actually delivers. */
export async function sendTestEmail(to: string) {
  const html = wrap(
    `<h2 style="font-size:20px;margin:0 0 16px;">Email is working</h2>
     <p>This is a test message from the AMSMA website. If you can read it, the
        mail transport is configured correctly and committee review invitations
        will be delivered.</p>
     <p style="color:#6b7280;font-size:13px;margin-top:32px;">
        Provider: ${emailProvider()} &middot; Mode: ${emailMode()} &middot; Sent ${new Date().toISOString()}
     </p>`,
    'AMSMA email transport test'
  );
  return send(to, 'AMSMA - email transport test', html);
}

// ============ Phase 1: Newsletter welcome ============

export async function sendNewsletterWelcome(email: string) {
  const html = wrap(
    `<h2 style="font-size:22px;margin:0 0 16px;">Welcome aboard.</h2>
     <p>Thank you for subscribing to the AMSMA monthly briefing. You&apos;ll receive
        policy updates, technical papers, event announcements and industry data —
        curated by the AMSMA Secretariat.</p>
     <p>Your first briefing will arrive on the first Monday of next month.</p>
     <p style="color:#6b7280;font-size:13px;margin-top:32px;">
        Didn&apos;t sign up? You can safely ignore this email.
     </p>`,
    'Welcome to the AMSMA monthly briefing'
  );
  return send(email, 'Welcome to the AMSMA monthly briefing', html);
}

// ============ Phase 3: Membership emails ============

export async function sendReviewInvitation(params: {
  committeeMemberEmail: string;
  committeeMemberName: string;
  applicationNo: string;
  organizationName: string;
  tierLabel: string;
  contactName: string;
  reviewToken: string;
}) {
  const reviewUrl = `${SITE}/review/${params.reviewToken}`;
  const html = wrap(
    `<h2 style="font-size:20px;margin:0 0 16px;">New membership application for your review</h2>
     <p>Dear ${params.committeeMemberName},</p>
     <p>A new membership application has been submitted and requires your review:</p>
     <table style="width:100%;margin:20px 0;background:#faf9f6;border-radius:6px;padding:16px;">
       <tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;">Application No.</td>
           <td style="padding:6px 12px;font-weight:600;">${params.applicationNo}</td></tr>
       <tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;">Organisation</td>
           <td style="padding:6px 12px;font-weight:600;">${params.organizationName}</td></tr>
       <tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;">Category</td>
           <td style="padding:6px 12px;">${params.tierLabel}</td></tr>
       <tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;">Contact person</td>
           <td style="padding:6px 12px;">${params.contactName}</td></tr>
     </table>
     <p style="margin:24px 0;">${button(reviewUrl, 'Review application')}</p>
     <p style="color:#6b7280;font-size:13px;">
       Per Rule 4 of the Association&apos;s Rules &amp; Regulations, admission of new
       members requires the approval of the Managing Committee. Your review link is
       valid for 14 days and can only be used once.
     </p>`,
    `New application ${params.applicationNo} for review`
  );
  return send(
    params.committeeMemberEmail,
    `[AMSMA Review] ${params.applicationNo} — ${params.organizationName}`,
    html
  );
}

export async function sendApprovalNotification(params: {
  applicantEmail: string;
  contactName: string;
  applicationNo: string;
  organizationName: string;
  amountRupees: number;
  paymentToken: string;
  paymentExpiresAt: Date;
}) {
  const payUrl = `${SITE}/membership/pay/${params.paymentToken}`;
  const html = wrap(
    `<h2 style="font-size:20px;margin:0 0 16px;">Your membership application has been approved</h2>
     <p>Dear ${params.contactName},</p>
     <p>We are pleased to inform you that the Managing Committee has approved the
        membership application of <strong>${params.organizationName}</strong>
        (Application No. ${params.applicationNo}).</p>
     <p>To activate your membership, please complete the annual subscription payment
        of <strong>₹${params.amountRupees.toLocaleString('en-IN')}</strong>:</p>
     <p style="margin:24px 0;">${button(payUrl, 'Complete payment')}</p>
     <p style="color:#6b7280;font-size:13px;">
       This payment link is valid until
       <strong>${params.paymentExpiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
       Once payment is received, your organisation will be entered in the Register of Members.
     </p>`,
    `AMSMA membership approved: ${params.applicationNo}`
  );
  return send(params.applicantEmail, `AMSMA membership approved — payment link inside`, html);
}

export async function sendRejectionNotification(params: {
  applicantEmail: string;
  contactName: string;
  applicationNo: string;
  organizationName: string;
  reason?: string;
}) {
  const html = wrap(
    `<h2 style="font-size:20px;margin:0 0 16px;">Regarding your membership application</h2>
     <p>Dear ${params.contactName},</p>
     <p>Thank you for your interest in the Aggregate &amp; M sand Manufacturers Association.</p>
     <p>After careful review, the Managing Committee has been unable to accept the
        membership application of <strong>${params.organizationName}</strong>
        (Application No. ${params.applicationNo}) at this time.</p>
     ${params.reason ? `<p><strong>Reasons noted:</strong> ${params.reason}</p>` : ''}
     <p>You are welcome to reapply in future. For any queries, please write to
        <a href="mailto:secretary@amsma.in" style="color:#d97b30;">secretary@amsma.in</a>.</p>
     <p style="color:#6b7280;font-size:13px;margin-top:32px;">— The AMSMA Secretariat</p>`,
    `AMSMA application update`
  );
  return send(params.applicantEmail, `AMSMA application update — ${params.applicationNo}`, html);
}

export async function sendPaymentReceipt(params: {
  applicantEmail: string;
  contactName: string;
  organizationName: string;
  memberNo: string;
  amountRupees: number;
  razorpayPaymentId: string;
  paidAt: Date;
}) {
  const html = wrap(
    `<h2 style="font-size:20px;margin:0 0 16px;">Welcome to AMSMA — payment received</h2>
     <p>Dear ${params.contactName},</p>
     <p><strong>${params.organizationName}</strong> is now a member of the
        Aggregate &amp; M sand Manufacturers Association.</p>
     <table style="width:100%;margin:20px 0;background:#faf9f6;border-radius:6px;padding:16px;">
       <tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;">Member No.</td>
           <td style="padding:6px 12px;font-weight:600;">${params.memberNo}</td></tr>
       <tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;">Amount paid</td>
           <td style="padding:6px 12px;font-weight:600;">₹${params.amountRupees.toLocaleString('en-IN')}</td></tr>
       <tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;">Payment ID</td>
           <td style="padding:6px 12px;font-family:monospace;font-size:13px;">${params.razorpayPaymentId}</td></tr>
       <tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;">Date</td>
           <td style="padding:6px 12px;">${params.paidAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
     </table>
     <p style="color:#6b7280;font-size:13px;">
       Please retain this email as your receipt. A formal GST invoice will follow separately.
     </p>`,
    'AMSMA membership active — payment received'
  );
  return send(params.applicantEmail, `AMSMA membership active — ${params.memberNo}`, html);
}

export async function sendApplicationConfirmation(params: {
  applicantEmail: string;
  contactName: string;
  applicationNo: string;
  organizationName: string;
  tierLabel: string;
}) {
  const html = wrap(
    `<h2 style="font-size:20px;margin:0 0 16px;">Application received</h2>
     <p>Dear ${params.contactName},</p>
     <p>Thank you for submitting a membership application for
        <strong>${params.organizationName}</strong>.</p>
     <table style="width:100%;margin:20px 0;background:#faf9f6;border-radius:6px;padding:16px;">
       <tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;">Application No.</td>
           <td style="padding:6px 12px;font-weight:600;">${params.applicationNo}</td></tr>
       <tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;">Category</td>
           <td style="padding:6px 12px;">${params.tierLabel}</td></tr>
     </table>
     <p>Your application is now being reviewed by the Managing Committee. As per the
        Association&apos;s Rules, approval requires a two-thirds majority of the committee.</p>
     <p>We will notify you as soon as a decision has been reached. If approved, you
        will receive a payment link to activate your membership.</p>`,
    `Application ${params.applicationNo} received`
  );
  return send(params.applicantEmail, `AMSMA application received — ${params.applicationNo}`, html);
}
