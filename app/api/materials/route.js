import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { isAdmin } from '@/lib/auth';
import { listMaterials, createMaterial, getUserById } from '@/lib/db';
import { validateMaterialPayload } from '@/lib/validate';

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export const dynamic = 'force-dynamic';

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

export async function GET(req) {
  const url = new URL(req.url);
  const subjectId = url.searchParams.get('subjectId');
  const term = url.searchParams.get('term');
  const type = url.searchParams.get('type');

  const materials = await listMaterials({
    subjectId: subjectId ? Number(subjectId) : undefined,
    term: term || undefined,
    type: type || undefined,
  });
  return NextResponse.json({ materials });
}

export async function POST(req) {
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to contribute.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const result = validateMaterialPayload(body);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const isAdminUser = await isAdmin();
  
  // NEW: Fetch the actual user from the database to get their real name
  const dbUser = await getUserById(user.userId);
  const displayName = dbUser?.name || (user.email ? user.email.split('@')[0] : 'Student');

  const materialData = {
    ...result.value,
    type: isAdminUser ? 'official' : 'community',
    uploadedBy: user.userId || null,
    uploadedByName: displayName, // Using the actual name now
  };

  const created = await createMaterial(materialData);
  return NextResponse.json({ material: created }, { status: 201 });
}
