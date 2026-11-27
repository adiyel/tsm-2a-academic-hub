import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);
if (!SECRET.length) {
  throw new Error('AUTH_SECRET is not set');
}

export async function PATCH(req) {
  const token = req.cookies.get('student_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const { rows } = await sql`SELECT password_hash FROM users WHERE id = ${payload.userId}`;
    const user = rows[0];

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return NextResponse.json({ error: 'Incorrect current password.' }, { status: 400 });

    const hash = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${payload.userId}`;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Password change failed' }, { status: 400 });
  }
}
