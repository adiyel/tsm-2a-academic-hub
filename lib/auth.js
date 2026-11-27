import crypto from 'node:crypto';
import { cookies } from 'next/headers';

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is not set.');
  }
  return secret;
}

export const COOKIE_NAME = 'tsm2a_admin';
const MAX_AGE = 60 * 60 * 8; // 8 hours

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

export function createSessionToken() {
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', exp: Date.now() + MAX_AGE * 1000 })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token) {
  if (!token) return false;
  const [payload, signature] = String(token).split('.');
  if (!payload || !signature) return false;

  const expected = Buffer.from(sign(payload));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length) return false;
  if (!crypto.timingSafeEqual(expected, provided)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.role === 'admin' && data.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAdmin() {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error('ADMIN_PASSWORD environment variable is not set.');
  }
  const provided = Buffer.from(String(input ?? ''));
  const expectedBuf = Buffer.from(expected);
  if (expectedBuf.length !== provided.length) return false;
  return crypto.timingSafeEqual(expectedBuf, provided);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE,
};
