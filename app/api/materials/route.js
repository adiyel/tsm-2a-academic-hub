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
  try {
    const user = await getUser(req);
    const admin = await isAdmin();

    // Allow if they are a student OR an admin
    if (!user && !admin) {
      return NextResponse.json({ error: 'You must be logged in to contribute.' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    // Force subjectId to be a Number
    if (body.subjectId) {
      body.subjectId = Number(body.subjectId);
    }

    const result = validateMaterialPayload(body);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Safely get the name
    let displayName = 'Admin';
    if (user) {
      const dbUser = await getUserById(user.userId);
      displayName = dbUser?.name || dbUser?.username || (user.email ? user.email.split('@')[0] : 'Student');
    }

    const materialData = {
      ...result.value,
      type: admin ? 'official' : 'community',
      uploadedBy: admin ? null : (user?.userId || null),
      uploadedByName: displayName,
    };

    const created = await createMaterial(materialData);
    return NextResponse.json({ material: created }, { status: 201 });

  } catch (error) {
    // This will catch any database errors and return them as JSON so the frontend doesn't crash
    console.error("POST API ERROR:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
