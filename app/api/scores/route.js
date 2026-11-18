import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { addScore, listScores, rankOfScore, clearScores } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-only-secret-change-me');

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const raw = Number(new URL(req.url).searchParams.get('limit'));
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(raw, 200) : 100;
  return NextResponse.json({ scores: await listScores(limit) });
}

export async function POST(req) {
  const body = await req.json().catch(() => null);
  
  // 1. Manually validate the score payload (since we removed the name requirement)
  const scoreNum = Number(body?.score);
  const totalNum = Number(body?.total);
  
  if (!Number.isInteger(scoreNum) || !Number.isInteger(totalNum) || totalNum < 1 || scoreNum < 0 || scoreNum > totalNum) {
    return NextResponse.json({ error: 'Invalid score payload.' }, { status: 400 });
  }
  
  const percent = Math.round((scoreNum / totalNum) * 100);
  const durationSeconds = Number(body?.durationSeconds) >= 0 
    ? Math.min(Math.round(Number(body.durationSeconds)), 60 * 60 * 6) 
    : null;

  // 2. Verify the user is logged in by checking their cookie
  const token = req.cookies.get('student_session')?.value;
  let user = null;
  
  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      user = payload;
    } catch (err) {
      // Token is invalid or expired
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to submit a score.' }, { status: 401 });
  }

  // 3. Prepare the data for the database
  const scoreData = {
    name: user.email.split('@')[0], // Use the email prefix as their display name
    userId: user.userId,
    isAnonymous: Boolean(body.isAnonymous),
    score: scoreNum,
    total: totalNum,
    percent: percent,
    durationSeconds: durationSeconds,
  };

  // 4. Save to database
  const row = await addScore(scoreData);
  const rank = await rankOfScore(row);
  
  return NextResponse.json({ score: row, rank }, { status: 201 });
}

export async function DELETE() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  await clearScores();
  return NextResponse.json({ ok: true });
}
