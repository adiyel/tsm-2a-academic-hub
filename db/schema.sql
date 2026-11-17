CREATE TABLE IF NOT EXISTS questions (
  id          SERIAL PRIMARY KEY,
  topic       TEXT        NOT NULL,
  question    TEXT        NOT NULL,
  options     JSONB       NOT NULL,
  answer_index INTEGER    NOT NULL,
  explanation TEXT        NOT NULL,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scores (
  id              SERIAL PRIMARY KEY,
  player_name     TEXT        NOT NULL,
  score           INTEGER     NOT NULL,
  total           INTEGER     NOT NULL,
  percent         INTEGER     NOT NULL,
  duration_seconds INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scores_rank_idx
  ON scores (percent DESC, score DESC, duration_seconds ASC NULLS LAST, created_at ASC);

CREATE TABLE IF NOT EXISTS announcements (
  id         SERIAL PRIMARY KEY,
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  pinned     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
