import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { addScore, listScores, rankOfScore, clearScores } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const raw = Number(new URL(req.url).searchParams.get('limit'));
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(raw, 200) : 100;
  return NextResponse.json({ scores: await listScores(limit) });
}

export async function POST(req) {
  const body = await req.json().catch(() => null);
  
  const scoreNum = Number(body?.score);
  const totalNum = Number(body?.total);
  
  if (!Number.isInteger(scoreNum) || !Number.isInteger(totalNum) || totalNum < 1 || scoreNum < 0 || scoreNum > totalNum) {
    return NextResponse.json({ error: 'Invalid score payload.' }, { status: 400 });
  }
  
  const percent = Math.round((scoreNum / totalNum) * 100);
  const durationSeconds = Number(body?.durationSeconds) || null;

  const token = req.cookies.get('student_session')?.value;
  let userPayload = null;
  
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      userPayload = payload;
    } catch {}
  }

  if (!userPayload) {
    return NextResponse.json({ error: 'You must be logged in to submit a score.' }, { status: 401 });
  }

  // Fetch the actual user from the database to get their display_name
  const { rows } = await sql`SELECT display_name FROM users WHERE id = ${userPayload.userId}`;
  const dbUser = rows[0];
  
  // Use display_name if it exists, otherwise fallback to the email prefix
  const finalName = dbUser?.display_name || userPayload.email.split('@')[0];

  const scoreData = {
    name: finalName,
    userId: userPayload.userId,
    isAnonymous: Boolean(body.isAnonymous),
    score: scoreNum,
    total: totalNum,
    percent: percent,
    durationSeconds: durationSeconds,
  };

  const row = await addScore(scoreData);
  const rank = await rankOfScore(row);
  return NextResponse.json({ score: row, rank }, { status: 201 });
}

export async function DELETE() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  await clearScores();
  return NextResponse.json({ ok: true });
}
