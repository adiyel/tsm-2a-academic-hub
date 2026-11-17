import { NextResponse } from 'next/server';
import { COOKIE_NAME, createSessionToken, checkPassword, SESSION_COOKIE_OPTIONS } from '@/lib/auth';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (!checkPassword(body.password)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, createSessionToken(), SESSION_COOKIE_OPTIONS);
  return res;
}
