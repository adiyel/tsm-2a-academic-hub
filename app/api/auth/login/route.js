import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { sql } from '@/lib/db';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);
if (!SECRET.length) {
  throw new Error('AUTH_SECRET is not set');
}

export async function POST(req) {
  const { email, password } = await req.json();

  const { rows } = await sql`SELECT * FROM users WHERE email = ${email}`;
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  // Create a secure session token
  const token = await new SignJWT({ userId: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET);

  const res = NextResponse.json({ success: true });
  res.cookies.set('student_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  
  return res;
}
