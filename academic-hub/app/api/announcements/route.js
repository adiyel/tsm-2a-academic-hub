import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { listAnnouncements, createAnnouncement } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ announcements: await listAnnouncements() });
}

export async function POST(req) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? '').trim();
  const text = String(body.body ?? '').trim();
  if (title.length < 3) return NextResponse.json({ error: 'Title is too short.' }, { status: 400 });
  if (text.length < 3) return NextResponse.json({ error: 'Body is too short.' }, { status: 400 });

  const created = await createAnnouncement({ title, body: text, pinned: Boolean(body.pinned) });
  return NextResponse.json({ announcement: created }, { status: 201 });
}
