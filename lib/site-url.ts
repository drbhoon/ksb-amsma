/**
 * The site's public base URL, normalised.
 *
 * NEXT_PUBLIC_SITE_URL is set by hand in the Railway dashboard, and Railway
 * displays hostnames without a scheme ("ksb-amsma-production.up.railway.app"),
 * so pasting the displayed value is the natural thing to do. A bare hostname
 * breaks two things:
 *
 *   - `new URL(...)` for metadataBase throws ERR_INVALID_URL, which fails the
 *     production build while collecting page data.
 *   - Magic-link review URLs and payment URLs get built as
 *     "host.railway.app/review/<token>", which is not a usable link. Those URLs
 *     are emailed and persisted, so a bad value cannot be repaired afterwards.
 *
 * Rather than depend on whoever edits the variable getting it exactly right,
 * add the scheme when it is missing and drop any trailing slash.
 */
export function siteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || 'https://amsma.in').trim();
  if (!raw) return 'https://amsma.in';
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, '');
}
