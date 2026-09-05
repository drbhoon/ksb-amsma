import crypto from 'crypto';
import { cookies } from 'next/headers';

/**
 * Admin authentication for the content sections.
 *
 * Deliberately not NextAuth. The magic-link design in Phase 5 depends on
 * working email, which the Association does not have yet, and a login that
 * cannot deliver its own link is not a login. This is a password check plus a
 * signed session cookie - small enough to read in full, and replaceable by
 * magic links later without touching the pages that call requireAdmin().
 *
 * ADMIN_PASSWORD_HASH holds a scrypt hash, never the password itself:
 *   node scripts/hash-admin-password.mjs
 *
 * SESSION_SECRET signs the cookie. Change it and every session is invalidated,
 * which is the intended way to log everyone out.
 */

const COOKIE = 'amsma_admin';
const MAX_AGE_SECONDS = 60 * 60 * 8; // one working day

function sessionSecret(): string | null {
  return process.env.SESSION_SECRET || null;
}

/** scrypt with a random salt, stored as "salt:hash" in hex. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  try {
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/** Is admin login usable at all? Both variables are required. */
export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD_HASH && sessionSecret());
}

export function checkPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) return false;
  return verifyPassword(password, stored);
}

// ---------- signed session cookie ----------

function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function makeToken(secret: string): string {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `admin.${expires}`;
  return `${payload}.${sign(payload, secret)}`;
}

function tokenValid(token: string, secret: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [subject, expiresRaw, signature] = parts;
  const payload = `${subject}.${expiresRaw}`;
  const expected = sign(payload, secret);

  // Timing-safe: a plain === leaks how much of the signature matched.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  const expires = Number(expiresRaw);
  return Number.isFinite(expires) && expires > Date.now();
}

export function startSession() {
  const secret = sessionSecret();
  if (!secret) throw new Error('SESSION_SECRET is not set');
  cookies().set(COOKIE, makeToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export function endSession() {
  cookies().set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export function isAdmin(): boolean {
  const secret = sessionSecret();
  if (!secret) return false;
  const token = cookies().get(COOKIE)?.value;
  return Boolean(token && tokenValid(token, secret));
}
