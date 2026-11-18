import pg from 'pg';
import { SEED_QUESTIONS } from './seed';

const { Pool } = pg;

// Prisma Postgres provides a standard connection string
const DB_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const USE_DB = Boolean(DB_URL);

let pool = null;
if (USE_DB) {
  pool = new Pool({ connectionString: DB_URL });
}

// Helper function to mimic the @vercel/postgres tagged template syntax
const sql = async (strings, ...values) => {
  if (!pool) throw new Error("Database not configured");
  let text = strings[0];
  for (let i = 1; i < strings.length; i++) {
    text += `$${i}` + strings[i];
  }
  const res = await pool.query(text, values);
  return { rows: res.rows };
};

const mem = {
  questions: SEED_QUESTIONS.map((q, i) => ({ id: i + 1, ...q, active: true, createdAt: new Date().toISOString() })),
  scores: [],
  announcements: [{ id: 1, title: 'Welcome!', body: 'Practice the items and check the leaderboard.', pinned: true, createdAt: new Date().toISOString() }],
  seq: { question: SEED_QUESTIONS.length + 1, score: 1, announcement: 2 },
};

const mapQuestion = (r) => ({ 
  id: r.id, 
  topic: r.topic, 
  question: r.question, 
  options: r.options, 
  answerIndex: r.answer_index, 
  explanation: r.explanation, 
  active: r.active, 
  createdAt: r.created_at 
});

const mapScore = (r) => ({ 
  id: r.id, 
  name: r.player_name, 
  score: r.score, 
  total: r.total, 
  percent: r.percent, 
  durationSeconds: r.duration_seconds, 
  createdAt: r.created_at,
  isAnonymous: r.is_anonymous,
  userId: r.user_id
});

const mapAnnouncement = (r) => ({ 
  id: r.id, 
  title: r.title, 
  body: r.body, 
  pinned: r.pinned, 
  createdAt: r.created_at 
});

const betterThan = (a, b) => {
  if (a.percent !== b.percent) return a.percent > b.percent;
  if (a.score !== b.score) return a.score > b.score;
  const da = a.durationSeconds ?? Number.MAX_SAFE_INTEGER;
  const db = b.durationSeconds ?? Number.MAX_SAFE_INTEGER;
  return da < db;
};

/* ------------------------------- questions ------------------------------- */

export async function listQuestions({ activeOnly = true } = {}) {
  if (!USE_DB) return mem.questions.filter((q) => (activeOnly ? q.active : true));
  const { rows } = activeOnly 
    ? await sql`SELECT * FROM questions WHERE active = TRUE ORDER BY id ASC`
    : await sql`SELECT * FROM questions ORDER BY id ASC`;
  return rows.map(mapQuestion);
}

export async function createQuestion(q) {
  if (!USE_DB) {
    const row = { id: mem.seq.question++, ...q, createdAt: new Date().toISOString() };
    mem.questions.push(row);
    return row;
  }
  const { rows } = await sql`
    INSERT INTO questions (topic, question, options, answer_index, explanation, active)
    VALUES (${q.topic}, ${q.question}, ${JSON.stringify(q.options)}::jsonb, ${q.answerIndex}, ${q.explanation}, ${q.active ?? true})
    RETURNING *`;
  return mapQuestion(rows[0]);
}

export async function createQuestions(list) {
  const out = [];
  for (const q of list) out.push(await createQuestion(q));
  return out;
}

export async function setQuestionActive(id, active) {
  if (!USE_DB) {
    const row = mem.questions.find((q) => q.id === Number(id));
    if (!row) return null;
    row.active = Boolean(active);
    return row;
  }
  const { rows } = await sql`UPDATE questions SET active = ${Boolean(active)} WHERE id = ${Number(id)} RETURNING *`;
  return rows[0] ? mapQuestion(rows[0]) : null;
}

export async function deleteQuestion(id) {
  if (!USE_DB) {
    const i = mem.questions.findIndex((q) => q.id === Number(id));
    if (i === -1) return false;
    mem.questions.splice(i, 1);
    return true;
  }
  await sql`DELETE FROM questions WHERE id = ${Number(id)}`;
  return true;
}

/* -------------------------------- scores --------------------------------- */

export async function addScore(s) {
  if (!USE_DB) {
    const row = { id: mem.seq.score++, ...s, createdAt: new Date().toISOString() };
    mem.scores.push(row);
    return row;
  }
  const { rows } = await sql`
    INSERT INTO scores (player_name, score, total, percent, duration_seconds, user_id, is_anonymous)
    VALUES (${s.name}, ${s.score}, ${s.total}, ${s.percent}, ${s.durationSeconds}, ${s.userId || null}, ${s.isAnonymous || false})
    RETURNING *`;
  return mapScore(rows[0]);
}

export async function listScores(limit = 100) {
  if (!USE_DB) return [...mem.scores].sort((a, b) => (betterThan(a, b) ? -1 : 1)).slice(0, limit);
  const { rows } = await sql`
    SELECT * FROM scores
    ORDER BY percent DESC, score DESC, COALESCE(duration_seconds, 999999) ASC, created_at ASC
    LIMIT ${limit}`;
  return rows.map(mapScore);
}

export async function rankOfScore(s) {
  if (!USE_DB) return mem.scores.filter((x) => betterThan(x, s)).length + 1;
  const { rows } = await sql`
    SELECT COUNT(*)::int AS c FROM scores
    WHERE percent > ${s.percent}
       OR (percent = ${s.percent} AND score > ${s.score})
       OR (percent = ${s.percent} AND score = ${s.score} AND COALESCE(duration_seconds, 999999) < ${s.durationSeconds ?? 999999})`;
  return rows[0].c + 1;
}

export async function deleteScore(id) {
  if (!USE_DB) {
    const i = mem.scores.findIndex((s) => s.id === Number(id));
    if (i === -1) return false;
    mem.scores.splice(i, 1);
    return true;
  }
  await sql`DELETE FROM scores WHERE id = ${Number(id)}`;
  return true;
}

export async function clearScores() {
  if (!USE_DB) { mem.scores = []; return true; }
  await sql`DELETE FROM scores`;
  return true;
}

/* ----------------------------- announcements ----------------------------- */

export async function listAnnouncements() {
  if (!USE_DB) return [...mem.announcements].sort((a, b) => Number(b.pinned) - Number(a.pinned) || (a.id < b.id ? 1 : -1));
  const { rows } = await sql`SELECT * FROM announcements ORDER BY pinned DESC, created_at DESC`;
  return rows.map(mapAnnouncement);
}

export async function createAnnouncement(a) {
  if (!USE_DB) {
    const row = { id: mem.seq.announcement++, ...a, createdAt: new Date().toISOString() };
    mem.announcements.push(row);
    return row;
  }
  const { rows } = await sql`
    INSERT INTO announcements (title, body, pinned)
    VALUES (${a.title}, ${a.body}, ${Boolean(a.pinned)})
    RETURNING *`;
  return mapAnnouncement(rows[0]);
}

export async function deleteAnnouncement(id) {
  if (!USE_DB) {
    const i = mem.announcements.findIndex((a) => a.id === Number(id));
    if (i === -1) return false;
    mem.announcements.splice(i, 1);
    return true;
  }
  await sql`DELETE FROM announcements WHERE id = ${Number(id)}`;
  return true;
}
