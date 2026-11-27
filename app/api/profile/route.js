import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { sql } from '@/lib/db';

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function GET(req) {
  const token = req.cookies.get('student_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const { rows } = await sql`SELECT id, email, display_name, always_anonymous, created_at FROM users WHERE id = ${payload.userId}`;
    const user = rows[0];
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Get stats
    const { rows: stats } = await sql`
      SELECT 
        COUNT(*)::int as total_quizzes,
        COALESCE(AVG(percent), 0)::int as average_accuracy,
        COALESCE(MAX(score), 0)::int as highest_score,
        (SELECT score FROM scores WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 1) as recent_score
      FROM scores WHERE user_id = ${user.id}
    `;
    
    // Get recent 5
    const { rows: recent } = await sql`
      SELECT score, total, percent, created_at 
      FROM scores WHERE user_id = ${user.id} 
      ORDER BY created_at DESC LIMIT 5
    `;

    return NextResponse.json({ user, stats: stats[0], recent });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function PATCH(req) {
  const token = req.cookies.get('student_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  try {
    const { payload } = await jwtVerify(token, getSecret());
    await sql`
      UPDATE users 
      SET display_name = ${body.displayName}, always_anonymous = ${body.alwaysAnonymous} 
      WHERE id = ${payload.userId}
    `;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 400 });
  }
}
