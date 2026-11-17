import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { listQuestions, createQuestion, createQuestions } from '@/lib/db';
import { validateQuestion } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const all = new URL(req.url).searchParams.get('all') === '1';
  if (all && !(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const questions = await listQuestions({ activeOnly: !all });
  return NextResponse.json({ questions });
}

export async function POST(req) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const payloads = Array.isArray(body) ? body : [body];

  const values = [];
  for (const [i, payload] of payloads.entries()) {
    const result = validateQuestion(payload);
    if (result.error) {
      return NextResponse.json({ error: `Item ${i + 1}: ${result.error}` }, { status: 400 });
    }
    values.push(result.value);
  }

  const created = values.length === 1
    ? [await createQuestion(values[0])]
    : await createQuestions(values);

  return NextResponse.json(
    { questions: created, count: created.length },
    { status: 201 }
  );
}
