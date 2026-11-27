import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);
if (!SECRET.length) {
  throw new Error('AUTH_SECRET is not set');
}

export async function GET(req) {
  const token = req.cookies.get('student_session')?.value;
  if (!token) return NextResponse.json({ loggedIn: false });

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return NextResponse.json({ loggedIn: true, email: payload.email });
  } catch {
    return NextResponse.json({ loggedIn: false });
  }
}
