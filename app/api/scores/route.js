import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { addScore, listScores, rankOfScore, clearScores } from '@/lib/db';
import { validateScore } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const raw = Number(new URL(req.url).searchParams.get('limit'));
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(raw, 200) : 100;
  return NextResponse.json({ scores: await listScores(limit) });
}

export async function POST(req) {
  const body = await req.json().catch(() => null);
  const result = validateScore(body);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const row = await addScore(result.value);
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
