import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';

/**
 * Search engines are kept out until the Association says otherwise.
 *
 * Once amsma.in points at this deployment the site is publicly reachable on the
 * Society's real domain, while still carrying test applications, test member
 * records and an active Rule 4 override. Having Google index that - and cache
 * it - would be difficult to undo and embarrassing to explain.
 *
 * Set SITE_INDEXABLE=true when the committee is ready to be found. /dev stays
 * disallowed either way.
 */
export default function robots(): MetadataRoute.Robots {
  const indexable = process.env.SITE_INDEXABLE === 'true';

  if (!indexable) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dev/', '/api/'] }],
    host: siteUrl(),
  };
}
