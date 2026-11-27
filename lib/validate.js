export function validateExamPayload(body) {
  if (!body || typeof body !== 'object') return { error: 'Invalid payload.' };
  
  const title = String(body.title ?? '').trim();
  const subject = String(body.subject ?? '').trim();
  const type = String(body.type ?? 'Mock Quiz').trim();
  const date = body.date ? new Date(body.date).toISOString() : null;
  const questions = body.questions;

  if (title.length < 3) return { error: 'Exam title is required.' };
  if (subject.length < 2) return { error: 'Subject is required.' };
  if (!['Mock Quiz', 'Mock Examination'].includes(type)) return { error: 'Invalid exam type.' };
  if (!Array.isArray(questions) || questions.length === 0) return { error: 'At least one question is required.' };

  const validQuestions = [];
  for (const [i, q] of questions.entries()) {
    const questionText = String(q.question ?? '').trim();
    const explanation = String(q.explanation ?? '').trim();
    const options = Array.isArray(q.options) ? q.options.map((o) => String(o).trim()) : [];
    const answerIndex = Number(q.answerIndex);

    if (questionText.length < 5) return { error: `Item ${i + 1}: Question text is required.` };
    if (options.length !== 4 || options.some((o) => !o)) {
      return { error: `Item ${i + 1}: Exactly four non-empty options are required.` };
    }
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) {
      return { error: `Item ${i + 1}: Invalid answer index.` };
    }
    if (explanation.length < 5) return { error: `Item ${i + 1}: Explanation is required.` };

    validQuestions.push({ question: questionText, options, answerIndex, explanation });
  }

  return { value: { title, subject, type, date, questions: validQuestions } };
}

export function validateScore(body) {
  const name = String(body?.name ?? '').trim().replace(/\s+/g, ' ');
  const score = Number(body?.score);
  const total = Number(body?.total);
  const durationSeconds = Number(body?.durationSeconds);

  if (name.length < 2 || name.length > 24) return { error: 'Name must be 2–24 characters.' };
  if (!Number.isInteger(score) || !Number.isInteger(total) || total < 1 || total > 500) {
    return { error: 'Invalid score payload.' };
  }
  if (score < 0 || score > total) return { error: 'Score cannot exceed the total number of items.' };

  const percent = Math.round((score / total) * 100);
  const duration =
    Number.isFinite(durationSeconds) && durationSeconds >= 0
      ? Math.min(Math.round(durationSeconds), 60 * 60 * 6)
      : null;

  return { value: { name, score, total, percent, durationSeconds: duration } };
}

export function validateSubjectPayload(body) {
  if (!body || typeof body !== 'object') return { error: 'Invalid payload.' };
  
  const name = String(body.name ?? '').trim();
  const code = String(body.code ?? '').trim().toUpperCase();
  const color = String(body.color ?? '#246b91').trim();

  if (name.length < 2) return { error: 'Subject name is required.' };
  if (code && !/^[A-Z0-9 ]{2,15}$/.test(code)) {
    return { error: 'Code can only contain letters, numbers, and spaces (max 15 chars).' };
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
    return { error: 'Invalid URL. Must start with http:// or https://' };
  }

  return { value: { title, description, url, term, subjectId } };
}
