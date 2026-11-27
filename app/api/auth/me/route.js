import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function GET(req) {
  const token = req.cookies.get('student_session')?.value;
  if (!token) return NextResponse.json({ loggedIn: false });

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return NextResponse.json({ loggedIn: true, email: payload.email });
  } catch {
    return NextResponse.json({ loggedIn: false });
  }
}
