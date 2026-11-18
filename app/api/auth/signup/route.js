import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

export async function POST(req) {
  const { email, password } = await req.json();

  if (!email.endsWith('@your-school.edu.ph')) {
    return NextResponse.json({ error: 'Must use official student email.' }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await sql`
      INSERT INTO users (email, password_hash) 
      VALUES (${email}, ${hash}) 
      RETURNING id, email
    `;
    return NextResponse.json({ user: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: 'Email already exists.' }, { status: 400 });
  }
}
