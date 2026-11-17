export function validateQuestion(body) {
  if (!body || typeof body !== 'object') return { error: 'Invalid payload.' };
  const topic = String(body.topic ?? '').trim();
  const question = String(body.question ?? '').trim();
  const explanation = String(body.explanation ?? '').trim();
  const options = Array.isArray(body.options) ? body.options.map((o) => String(o).trim()) : [];
  const answerIndex = Number(body.answerIndex);

  if (topic.length < 2) return { error: 'Topic is required.' };
  if (question.length < 5) return { error: 'Question text is required.' };
  if (options.length !== 4 || options.some((o) => !o)) {
    return { error: 'Exactly four non-empty options are required.' };
  }
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) {
    return { error: 'The correct answer must be one of A, B, C, or D.' };
  }
  if (explanation.length < 5) return { error: 'An explanation is required.' };

  return {
    value: { topic, question, options, answerIndex, explanation, active: body.active !== false },
  };
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
