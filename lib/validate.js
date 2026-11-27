export function validateSubjectPayload(body) {
  if (!body || typeof body !== 'object') return { error: 'Invalid payload.' };
  
  const name = String(body.name ?? '').trim();
  const code = String(body.code ?? '').trim().toUpperCase();
  const color = String(body.color ?? '#246b91').trim();

  if (name.length < 2) return { error: 'Subject name is required.' };
  if (code && !/^[A-Z0-9]{2,6}$/.test(code)) {
    return { error: 'Code must be 2-6 letters or numbers.' };
  }

  return { value: { name, code: code || null, color } };
}

export function validateMaterialPayload(body) {
  if (!body || typeof body !== 'object') return { error: 'Invalid payload.' };

  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();
  const url = String(body.url ?? '').trim();
  const term = String(body.term ?? '').trim();
  const subjectId = Number(body.subjectId);

  if (title.length < 3) return { error: 'Title is required (min 3 chars).' };
  if (title.length > 120) return { error: 'Title too long (max 120 chars).' };
  if (description.length > 300) return { error: 'Description too long (max 300 chars).' };
  if (!['midterm', 'finals'].includes(term)) return { error: 'Invalid term.' };
  if (!Number.isInteger(subjectId) || subjectId < 1) return { error: 'Invalid subject.' };

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { error: 'Only http:// and https:// links are allowed.' };
    }
  } catch {
    return { error: 'Invalid URL.' };
  }

  return { value: { title, description, url, term, subjectId } };
}
