import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { deleteSubject } from '@/lib/db';

export async function DELETE(_req, { params }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const { id } = await params;
  await deleteSubject(id);
  return NextResponse.json({ ok: true });
}
