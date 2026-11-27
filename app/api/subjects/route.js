import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { listSubjects, createSubject } from '@/lib/db';
import { validateSubjectPayload } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ subjects: await listSubjects() });
}

export async function POST(req) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const result = validateSubjectPayload(body);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  try {
    const created = await createSubject(result.value);
    return NextResponse.json({ subject: created }, { status: 201 });
  } catch (e) {
    if (String(e).includes('duplicate')) {
      return NextResponse.json({ error: 'Subject name already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Could not create subject.' }, { status: 500 });
  }
}
