'use client';

import { useCallback, useEffect, useState } from 'react';

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

  if (checking) return <section className="card"><p className="note">Checking access…</p></section>;
  if (!admin) return <LoginForm onSuccess={check} />;

  return <Dashboard onLogout={check} />;
}

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
            <input id="admin-password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </>
  );
}

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
          <button className="pill" onClick={logout} style={{ cursor: 'pointer', font: 'inherit' }}>Sign out →</button>
        </div>
      </header>

      <div className="tabs">
        {[
          ['questions', 'Exams & Quizzes'],
          ['announcements', 'Announcements'],
          ['students', 'Students'],
          ['scores', 'Leaderboard'],
        ].map(([key, label]) => (
          <button key={key} className={`tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'questions' && <QuestionsPanel />}
      {tab === 'announcements' && <AnnouncementsPanel />}
      {tab === 'students' && <StudentsPanel />}
      {tab === 'scores' && <ScoresPanel />}
    </>
  );
}

function QuestionsPanel() {
  const [exams, setExams] = useState(null);
  const [jsonInput, setJsonInput] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/questions?all=1', { cache: 'no-store' });
    const data = await res.json();
    
    const grouped = {};
    (data.questions || []).forEach(q => {
      const id = q.examId || 'unscheduled';
      if (!grouped[id]) {
        grouped[id] = {
          id: id,
          title: q.quizTitle || 'Unscheduled Questions',
          subject: q.topic,
          type: q.examType || 'Mock Quiz',
          date: q.examDate,
          count: 0
        };
      }
      grouped[id].count++;
    });
    
    setExams(Object.values(grouped).sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    }));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleImport(e) {
    e.preventDefault();
    setBusy(true);
    setMessage({ type: '', text: '' });
    
    try {
      const parsed = JSON.parse(jsonInput);
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Import failed.' });
      } else {
        setJsonInput('');
        setMessage({ type: 'success', text: 'Exam imported successfully!' });
        load();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Invalid JSON format.' });
    } finally {
      setBusy(false);
    }
  }

  async function removeExam(id) {
    if (!confirm('Delete this entire exam and all its questions?')) return;
    await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <>
      <section className="card">
        <h2 style={{ margin: '0 0 14px', fontSize: '1.05rem', color: 'var(--navy)' }}>Import Exam (JSON)</h2>
        {message.text && <div className={message.type === 'error' ? 'error' : 'success'}>{message.text}</div>}
        
        <form onSubmit={handleImport}>
          <div className="field">
            <textarea
              className="textarea"
              style={{ minHeight: 200, fontFamily: 'ui-monospace, monospace', fontSize: '.82rem' }}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{ "title": "CCNA Exam", "subject": "Networking", "type": "Mock Examination", "date": "2024-11-24T09:00", "questions": [ ... ] }'
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy || !jsonInput.trim()}>
            {busy ? 'Importing...' : 'Import Exam'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2 style={{ margin: '0 0 14px', fontSize: '1.05rem', color: 'var(--navy)' }}>Manage Exams</h2>
        {exams === null ? (
          <p className="note">Loading…</p>
        ) : exams.length === 0 ? (
          <p className="note">No exams uploaded yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {exams.map((ex) => (
              <div className="review-item" key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span className={`tag ${ex.type === 'Mock Examination' ? 'off' : 'on'}`}>{ex.type}</span>
                    <span className="note">{ex.subject}</span>
                  </div>
                  <div className="rq" style={{ marginBottom: 4 }}>{ex.title}</div>
                  <div className="note">
                    {ex.date ? new Date(ex.date).toLocaleString() : 'Unscheduled'} · {ex.count} items
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => removeExam(ex.id)}>Delete</button>
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
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="field">
            <label>Message</label>
            <textarea className="textarea" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, fontSize: '.88rem' }}>
            <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
            Pin to the top
          </label>
          <button className="btn btn-primary" type="submit">Post announcement</button>
        </form>
      </section>

      <section className="card">
        <h2 style={{ margin: '0 0 14px', fontSize: '1.05rem', color: 'var(--navy)' }}>Existing announcements</h2>
        {items === null ? (
          <p className="note">Loading…</p>
        ) : items.length === 0 ? (
          <p className="note">None yet.</p>
        ) : (
          items.map((a) => (
            <div className="review-item" key={a.id}>
              <div className="rq">{a.pinned ? '📌 ' : ''}{a.title}</div>
              <div className="ra">
                {a.body}
                <div className="note" style={{ marginTop: 4 }}>
                  Made by TSM 2A MAYOR · {new Date(a.createdAt).toLocaleString()}
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <button className="btn btn-danger btn-sm" onClick={() => remove(a.id)}>Delete</button>
             
