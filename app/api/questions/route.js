import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { isAdmin } from '@/lib/auth';
import { listQuestions, createExam } from '@/lib/db';
import { validateExamPayload } from '@/lib/validate';

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const url = new URL(req.url);
  const all = url.searchParams.get('all') === '1';
  const title = url.searchParams.get('title');
  const examId = url.searchParams.get('examId');
  
  if (all) {
    if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const questions = await listQuestions({ activeOnly: false });
    return NextResponse.json({ questions });
  }

  const token = req.cookies.get('student_session')?.value;
  let isStudent = false;

  if (token) {
    try {
      await jwtVerify(token, getSecret());
      isStudent = true;
    } catch {}
  }

  if (!isStudent) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // Fetch all active questions
  let questions = await listQuestions({ activeOnly: true });

  // Filter by examId (preferred) or fallback to title (for backward compat)
  if (examId) {
    questions = questions.filter(q => q.examId === examId);
  } else if (title) {
    questions = questions.filter(q => q.quizTitle === title);
}

  return NextResponse.json({ questions });
  }
  // If a title is provided, filter by that quiz title
  if (title) {
    questions = questions.filter(q => q.quizTitle === title);
  }

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
