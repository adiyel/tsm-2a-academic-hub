import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { setQuestionActive, deleteQuestion } from '@/lib/db';

export async function PATCH(req, { params }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const updated = await setQuestionActive(id, body.active);
  if (!updated) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ question: updated });
}

export async function DELETE(_req, { params }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const { id } = await params;
  await deleteQuestion(id);
  return NextResponse.json({ ok: true });
}
