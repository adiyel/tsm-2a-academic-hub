import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export async function POST(req) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { emails, defaultPassword } = await req.json();
  
  if (!Array.isArray(emails) || !defaultPassword) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const hash = await bcrypt.hash(defaultPassword, 10);
  let created = 0;

  for (const email of emails) {
    try {
      await sql`
        INSERT INTO users (email, password_hash) 
        VALUES (${email.trim().toLowerCase()}, ${hash})
      `;
      created++;
    } catch (e) {
      // Ignore duplicates
    }
  }

  return NextResponse.json({ success: true, count: created });
}
