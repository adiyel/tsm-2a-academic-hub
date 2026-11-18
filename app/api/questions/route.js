import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { isAdmin } from '@/lib/auth';
import { listQuestions, createQuestion, createQuestions } from '@/lib/db';
import { validateQuestion } from '@/lib/validate';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret');

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const all = new URL(req.url).searchParams.get('all') === '1';
  
  if (all) {
    // Only admins can see hidden questions
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const questions = await listQuestions({ activeOnly: false });
    return NextResponse.json({ questions });
  }

  // For standard students, check if they are logged in
  const token = req.cookies.get('student_session')?.value;
  let isStudent = false;

  if (token) {
    try {
      await jwtVerify(token, SECRET);
      isStudent = true;
    } catch {}
  }

  if (!isStudent) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // Logged-in student gets the active questions
  const questions = await listQuestions({ activeOnly: true });
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
