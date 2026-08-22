import crypto from 'crypto';

/** Cryptographically secure URL-safe token, ~43 chars from 32 random bytes. */
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/** Timing-safe token comparison to prevent enumeration attacks. */
export function tokensMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
