import pg from 'pg';
import { SEED_QUESTIONS } from './seed';

const { Pool } = pg;

const DB_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const USE_DB = Boolean(DB_URL);

let pool = null;
if (USE_DB) {
  pool = new Pool({ connectionString: DB_URL });
}

export const sql = async (strings, ...values) => {
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
  subjects: [],
  materials: [],
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
  createdAt: r.created_at,
  quizTitle: r.quiz_title,
  examDate: r.exam_date,
  examType: r.exam_type,
  examId: r.exam_id
});

const mapScore = (r, { admin = false } = {}) => {
  const isAnonymous = r.is_anonymous === true;
  const hideName = isAnonymous && !admin;

  return {
    id: r.id,
    name: hideName ? 'Anonymous Student' : r.player_name,
    userId: hideName ? null : r.user_id,
    isAnonymous,
    score: r.score,
    total: r.total,
    percent: r.percent,
    durationSeconds: r.duration_seconds,
    createdAt: r.created_at,
  };
};

const mapAnnouncement = (r) => ({ id: r.id, title: r.title, body: r.body, pinned: r.pinned, createdAt: r.created_at });

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

export async function listQuizzes() {
  if (!USE_DB) {
    const groups = {};
    mem.questions.forEach(q => {
      const key = q.quizTitle || 'Unscheduled Practice';
      if (!groups[key]) {
        groups[key] = { 
          title: key,
          topic: q.topic,
          type: q.examType || 'Mock Quiz',
          date: q.examDate || null,
          count: 0,
          examId: q.examId };
      }
      groups[key].count++;
    });
    return Object.values(groups);
  }

  const { rows } = await sql`
    SELECT 
      COALESCE(quiz_title, 'Unscheduled Practice') as title,
      topic,
      COALESCE(exam_type, 'Mock Quiz') as type,
      exam_date,
      COUNT(*)::int as count
    FROM questions 
    WHERE active = TRUE
    GROUP BY quiz_title, topic, exam_type, exam_date
  `;
  return rows.map(r => ({ title: r.title, topic: r.topic, type: r.type, date: r.exam_date, count: r.count }));
}

export async function createExam(exam) {
  if (!USE_DB) return;
  const examId = crypto.randomUUID();
  for (const q of exam.questions) {
    await sql`
      INSERT INTO questions (topic, question, options, answer_index, explanation, active, quiz_title, exam_type, exam_date, exam_id)
      VALUES (${exam.subject}, ${q.question}, ${JSON.stringify(q.options)}::jsonb, ${q.answerIndex}, ${q.explanation}, true, ${exam.title}, ${exam.type}, ${exam.date}, ${examId})
    `;
  }
  return examId;
}

export async function deleteExam(examId) {
  if (!USE_DB) return;
  await sql`DELETE FROM questions WHERE exam_id = ${examId}`;
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

export async function listScores(limit = 100, opts = {}) {
  if (!USE_DB) return [...mem.scores].sort((a, b) => (betterThan(a, b) ? -1 : 1)).slice(0, limit);
  const { rows } = await sql`
    SELECT * FROM scores
    ORDER BY percent DESC, score DESC, COALESCE(duration_seconds, 999999) ASC, created_at ASC
    LIMIT ${limit}`;
  return rows.map(r => mapScore(r, opts));
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
/* ------------------------------- subjects ------------------------------- */

const mapSubject = (r) => ({
  id: r.id,
  name: r.name,
  code: r.code,
  color: r.color,
  materialCount: r.material_count ? Number(r.material_count) : 0,
  createdAt: r.created_at,
});

export async function listSubjects() {
  if (!USE_DB) {
    return mem.subjects?.map(s => ({
      ...s,
      materialCount: mem.materials.filter(m => m.subjectId === s.id).length,
    })) || [];
  }
  const { rows } = await sql`
    SELECT s.*, COUNT(m.id)::int as material_count
    FROM subjects s
    LEFT JOIN materials m ON m.subject_id = s.id
    GROUP BY s.id
    ORDER BY s.name ASC
  `;
  return rows.map(mapSubject);
}

export async function createSubject(s) {
  if (!USE_DB) {
    if (!mem.subjects) mem.subjects = [];
    const row = { id: mem.subjects.length + 1, ...s, createdAt: new Date().toISOString() };
    mem.subjects.push(row);
    return row;
  }
  const { rows } = await sql`
    INSERT INTO subjects (name, code, color)
    VALUES (${s.name}, ${s.code}, ${s.color})
    RETURNING *
  `;
  return mapSubject(rows[0]);
}

export async function deleteSubject(id) {
  if (!USE_DB) {
    if (!mem.subjects) return true;
    mem.subjects = mem.subjects.filter(s => s.id !== Number(id));
    return true;
  }
  await sql`DELETE FROM subjects WHERE id = ${Number(id)}`;
  return true;
}

/* ------------------------------ materials ------------------------------- */

const mapMaterial = (r) => ({
  id: r.id,
  subjectId: r.subject_id,
  term: r.term,
  type: r.type,
  title: r.title,
  description: r.description,
  url: r.url,
  uploadedBy: r.uploaded_by,
  uploadedByName: r.uploaded_by_name,
  verified: r.verified,
  createdAt: r.created_at,
});

export async function listMaterials({ subjectId, term, type } = {}) {
  if (!USE_DB) {
    if (!mem.materials) mem.materials = [];
    let list = mem.materials;
    if (subjectId) list = list.filter(m => m.subjectId === Number(subjectId));
    if (term) list = list.filter(m => m.term === term);
    if (type) list = list.filter(m => m.type === type);
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Build the query safely using the pg pool directly
  let query = 'SELECT * FROM materials WHERE 1=1';
  const values = [];
  
  if (subjectId) {
    values.push(Number(subjectId));
    query += ` AND subject_id = $${values.length}`;
  }
  if (term) {
    values.push(term);
    query += ` AND term = $${values.length}`;
  }
  if (type) {
    values.push(type);
    query += ` AND type = $${values.length}`;
  }
  
  query += ' ORDER BY created_at DESC';
  
  const res = await pool.query(query, values);
  return res.rows.map(mapMaterial);
}

export async function createMaterial(m) {
  if (!USE_DB) {
    if (!mem.materials) mem.materials = [];
    const row = { 
      id: mem.materials.length + 1, 
      ...m, 
      verified: false, 
      createdAt: new Date().toISOString() 
    };
    mem.materials.push(row);
    return row;
  }

  const { rows } = await sql`
    INSERT INTO materials (subject_id, term, type, title, description, url, uploaded_by, uploaded_by_name, verified)
    VALUES (${m.subjectId}, ${m.term}, ${m.type}, ${m.title}, ${m.description}, ${m.url}, ${m.uploadedBy || null}, ${m.uploadedByName || null}, false)
    RETURNING *
  `;
  return mapMaterial(rows[0]);
}

export async function getMaterial(id) {
  if (!USE_DB) {
    if (!mem.materials) return null;
    return mem.materials.find(m => m.id === Number(id)) || null;
  }
  const { rows } = await sql`SELECT * FROM materials WHERE id = ${Number(id)}`;
  return rows[0] ? mapMaterial(rows[0]) : null;
}

export async function deleteMaterial(id) {
  if (!USE_DB) {
    if (!mem.materials) return true;
    mem.materials = mem.materials.filter(m => m.id !== Number(id));
    return true;
  }
  await sql`DELETE FROM materials WHERE id = ${Number(id)}`;
  return true;
}

export async function verifyMaterial(id, verified) {
  if (!USE_DB) {
    if (!mem.materials) return null;
    const row = mem.materials.find(m => m.id === Number(id));
    if (row) row.verified = Boolean(verified);
    return row;
  }
  const { rows } = await sql`
    UPDATE materials 
    SET verified = ${Boolean(verified)} 
    WHERE id = ${Number(id)} 
    RETURNING *
  `;
  return rows[0] ? mapMaterial(rows[0]) : null;
}
/* -------------------------------- users ---------------------------------- */
export async function getUserById(id) {
  if (!USE_DB) return null; 
  // CHANGE 'name' to the actual column name (e.g., username, full_name, display_name)
  const { rows } = await sql`SELECT id, display_name as name, email FROM users WHERE id = ${id}`;
  return rows[0] || null;
}
