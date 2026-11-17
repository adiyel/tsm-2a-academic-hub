'use client';

import { useCallback, useEffect, useState } from 'react';

const BLANK_QUESTION = {
  topic: 'Queues',
  question: '',
  options: ['', '', '', ''],
  answerIndex: 0,
  explanation: '',
};

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [admin, setAdmin] = useState(false);

  const check = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/session', { cache: 'no-store' });
      const data = await res.json();
      setAdmin(Boolean(data.admin));
    } catch {
      setAdmin(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  if (checking) {
    return <section className="card"><p className="note">Checking access…</p></section>;
  }

  if (!admin) {
    return <LoginForm onSuccess={check} />;
  }

  return <Dashboard onLogout={check} />;
}

/* ------------------------------- login ------------------------------- */

function LoginForm({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Incorrect password.');
        return;
      }
      setPassword('');
      onSuccess();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="hero" style={{ marginBottom: 18 }}>
        <div className="eyebrow">Restricted area</div>
        <h1>Admin access</h1>
        <p>Only authorized officers of TSM 2A may edit content and manage the leaderboard.</p>
      </header>

      <section className="card" style={{ maxWidth: 440, margin: '0 auto' }}>
        <form onSubmit={submit}>
          {error && <div className="error">{error}</div>}
          <div className="field">
            <label htmlFor="admin-password">Admin password</label>
            <input
              id="admin-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="note" style={{ marginTop: 14 }}>
          Sessions last 8 hours and are stored in an HTTP-only signed cookie.
        </p>
      </section>
    </>
  );
}

/* ----------------------------- dashboard ----------------------------- */

function Dashboard({ onLogout }) {
  const [tab, setTab] = useState('questions');

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    onLogout();
  }

  return (
    <>
      <header className="hero" style={{ marginBottom: 18 }}>
        <div className="eyebrow">Authorized</div>
        <h1>Admin dashboard</h1>
        <p>Manage the question bank, announcements, and leaderboard for TSM 2A.</p>
        <div className="pills">
          <span className="pill">Signed in as admin</span>
          <button className="pill" onClick={logout} style={{ cursor: 'pointer', font: 'inherit' }}>
            Sign out →
          </button>
        </div>
      </header>

      <div className="tabs">
        {[
          ['questions', 'Questions'],
          ['announcements', 'Announcements'],
          ['scores', 'Leaderboard'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`tab${tab === key ? ' active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'questions' && <QuestionsPanel />}
      {tab === 'announcements' && <AnnouncementsPanel />}
      {tab === 'scores' && <ScoresPanel />}
    </>
  );
}

function QuestionsPanel() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(BLANK_QUESTION);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [bulk, setBulk] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/questions?all=1', { cache: 'no-store' });
    const data = await res.json();
    setItems(data.questions || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  function setOption(i, value) {
    setForm((f) => {
      const options = [...f.options];
      options[i] = value;
      return { ...f, options };
    });
  }

  async function addQuestion(e) {
    e.preventDefault();
    setBusy(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Could not add the question.' });
        return;
      }
      setForm({ ...BLANK_QUESTION, topic: form.topic });
      setMessage({ type: 'success', text: 'Question added.' });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function importBulk(e) {
    e.preventDefault();
    setBusy(true);
    setMessage({ type: '', text: '' });
    try {
      let parsed;
      try {
        parsed = JSON.parse(bulk);
      } catch {
        setMessage({ type: 'error', text: 'That is not valid JSON.' });
        return;
      }
      const payload = Array.isArray(parsed) ? parsed : [parsed];
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Import failed.' });
        return;
      }
      setBulk('');
      setMessage({ type: 'success', text: `${data.count} question(s) imported.` });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function toggle(q) {
    await fetch(`/api/questions/${q.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !q.active }),
    });
    load();
  }

  async function remove(q) {
    if (!confirm('Delete this question permanently?')) return;
    await fetch(`/api/questions/${q.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <>
      <section className="card">
        <h2 style={{ margin: '0 0 14px', fontSize: '1.05rem', color: 'var(--navy)' }}>Add a question</h2>
        {message.text && <div className={message.type === 'error' ? 'error' : 'success'}>{message.text}</div>}
        <form onSubmit={addQuestion}>
          <div className="row2">
            <div className="field">
              <label>Topic</label>
              <input
                className="input"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Correct answer</label>
              <select
                className="select"
                value={form.answerIndex}
                onChange={(e) => setForm({ ...form, answerIndex: Number(e.target.value) })}
              >
                <option value={0}>A</option>
                <option value={1}>B</option>
                <option value={2}>C</option>
                <option value={3}>D</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Question</label>
            <textarea
              className="textarea"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              required
            />
          </div>

          {form.options.map((opt, i) => (
            <div className="field" key={i}>
              <label>Option {['A', 'B', 'C', 'D'][i]}</label>
              <input
                className="input"
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                required
              />
            </div>
          ))}

          <div className="field">
            <label>Explanation</label>
            <textarea
              className="textarea"
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={busy}>Add question</button>
        </form>
      </section>

      <section className="card">
        <h2 style={{ margin: '0 0 14px', fontSize: '1.05rem', color: 'var(--navy)' }}>Bulk import (JSON)</h2>
        <p className="note" style={{ marginTop: 0 }}>
          Paste an array of objects with <code>topic</code>, <code>question</code>,{' '}
          <code>options</code> (4 strings), <code>answerIndex</code> (0–3), and <code>explanation</code>.
        </p>
        <form onSubmit={importBulk}>
          <div className="field">
            <textarea
              className="textarea"
              style={{ minHeight: 140, fontFamily: 'ui-monospace, monospace', fontSize: '.82rem' }}
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              placeholder='[{"topic":"Stacks","question":"…","options":["…","…","…","…"],"answerIndex":1,"explanation":"…"}]'
            />
          </div>
          <button className="btn btn-ghost" type="submit" disabled={busy || !bulk.trim()}>Import</button>
        </form>
      </section>

      <section className="card">
        <h2 style={{ margin: '0 0 14px', fontSize: '1.05rem', color: 'var(--navy)' }}>
          Question bank {items ? `(${items.length})` : ''}
        </h2>
        {items === null ? (
          <p className="note">Loading…</p>
        ) : items.length === 0 ? (
          <p className="note">No questions yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {items.map((q) => (
              <div className="review-item" key={q.id}>
                <div className="rq">{q.question}</div>
                <div className="ra" style={{ marginBottom: 6 }}>
                  <span className="topic">{q.topic}</span>{' '}
                  <span className={`tag ${q.active ? 'on' : 'off'}`}>
                    {q.active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <div className="ra">
                  <strong>Answer:</strong> {q.options[q.answerIndex]}
                </div>
                <div className="ra" style={{ marginTop: 4 }}>{q.explanation}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggle(q)}>
                    {q.active ? 'Hide' : 'Activate'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(q)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function AnnouncementsPanel() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', pinned: false });
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = useCallback(async () => {
    const res = await fetch('/api/announcements', { cache: 'no-store' });
    const data = await res.json();
    setItems(data.announcements || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function add(e) {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: 'error', text: data.error || 'Could not post the announcement.' });
      return;
    }
    setForm({ title: '', body: '', pinned: false });
    setMessage({ type: 'success', text: 'Announcement posted.' });
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this announcement?')) return;
    await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <>
      <section className="card">
        <h2 style={{ margin: '0 0 14px', fontSize: '1.05rem', color: 'var(--navy)' }}>New announcement</h2>
        {message.text && <div className={message.type === 'error' ? 'error' : 'success'}>{message.text}</div>}
        <form onSubmit={add}>
          <div className="field">
            <label>Title</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Message</label>
            <textarea
              className="textarea"
              value={form.body}
              onChange={(e) => setForm({ ...form
