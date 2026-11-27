import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { isAdmin } from '@/lib/auth';
import { getMaterial, deleteMaterial, verifyMaterial } from '@/lib/db';

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');
  return new TextEncoder().encode(secret);
}

async function getUser(req) {
  const token = req.cookies.get('student_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const user = await getUser(req);
  const admin = await isAdmin();

  if (!user && !admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const material = await getMaterial(id);
  if (!material) {
    return NextResponse.json({ error: 'Material not found.' }, { status: 404 });
  }

  // Only admin or the uploader can delete
  if (!admin && material.uploadedBy !== user?.userId) {
    return NextResponse.json({ error: 'You can only delete your own uploads.' }, { status: 403 });
  }

  await deleteMaterial(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req, { params }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const updated = await verifyMaterial(id, Boolean(body.verified));
  if (!updated) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ material: updated });
}
