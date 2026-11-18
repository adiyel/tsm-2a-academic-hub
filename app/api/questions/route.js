import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { isAdmin } from '@/lib/auth';
import { listQuestions, createExam } from '@/lib/db';
import { validateExamPayload } from '@/lib/validate';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret');

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const all = new URL(req.url).searchParams.get('all') === '1';
  
  if (all) {
    if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const questions = await listQuestions({ activeOnly: false });
    return NextResponse.json({ questions });
  }

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

  const questions = await listQuestions({ activeOnly: true });
  return NextResponse.json({ questions });
}

export async function POST(req) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const result = validateExamPayload(body);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const examId = await createExam(result.value);
  return NextResponse.json({ success: true, examId }, { status: 201 });
}
