import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { addScore, listScores, rankOfScore, clearScores } from '@/lib/db';
import { validateScore } from '@/lib/validate';
import { isAdmin } from '@/lib/auth';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret');

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const raw = Number(new URL(req.url).searchParams.get('limit'));
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(raw, 200) : 100;
  return NextResponse.json({ scores: await listScores(limit) });
}

export async function POST(req) {
  const body = await req.json().catch(() => null);
  const result = validateScore({ ...body, name: 'Temp' }); // Skip name validation for now
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  // Get user from cookie
  const token = req.cookies.get('student_session')?.value;
  let user = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      user = payload;
    } catch {}
  }

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to submit a score.' }, { status: 401 });
  }

  const scoreData = {
    name: user.email.split('@')[0], // Use email prefix as name
    userId: user.userId,
    isAnonymous: Boolean(body.isAnonymous),
    score: result.value.score,
    total: result.value.total,
    percent: result.value.percent,
    durationSeconds: result.value.durationSeconds,
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
