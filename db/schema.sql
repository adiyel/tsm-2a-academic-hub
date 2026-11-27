-- TSM 2A Academic Hub — Complete Schema
-- Generated from live database information_schema
-- Run this to rebuild the database from scratch

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  display_name TEXT,
  always_anonymous BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  answer_index INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quiz_title TEXT,
  exam_date TIMESTAMPTZ,
  exam_type TEXT DEFAULT 'Mock Quiz',
  exam_id UUID DEFAULT gen_random_uuid()
);

-- ============================================================
-- SCORES
-- ============================================================
CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  percent INTEGER NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id INTEGER REFERENCES users(id),
  is_anonymous BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS scores_rank_idx
  ON scores (percent DESC, score DESC, duration_seconds ASC NULLS LAST, created_at ASC);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  color TEXT DEFAULT '#246b91',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  term TEXT NOT NULL CHECK (term IN ('midterm', 'finals')),
  type TEXT NOT NULL CHECK (type IN ('official', 'community')),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_by_name TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS materials_lookup_idx 
  ON materials (subject_id, term, type, created_at DESC);
