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
  
  // --- MATERIALS STATE ---
  const [materials, setMaterials] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({ subjectId: '', term: 'Midterm', type: 'official', title: '', description: '', url: '' });
  const [subjectsList, setSubjectsList] = useState([]);

  const fetchMaterials = async () => {
    const res = await fetch('/api/materials');
    const data = await res.json();
    setMaterials(data.materials || []);
  };

  useEffect(() => {
    if (tab === 'materials') {
      fetchMaterials();
      fetch('/api/subjects').then(res => res.json()).then(data => setSubjectsList(data.subjects || []));
    }
  }, [tab]);
  // -----------------------

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
          ['subjects', 'Subjects & Resources'],
          ['materials', 'Manage Materials'],
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
      {tab === 'subjects' && <SubjectsPanel />}
      
      {tab === 'materials' && (
        <section className="card">
          <h2 style={{ margin: '0 0 14px', fontSize: '1.05rem', color: 'var(--navy)' }}>Community Uploaded Materials</h2>
          
          {/* ADD OFFICIAL MATERIAL FORM */}
          <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #eee' }}>
            <button className="btn btn-ghost" onClick={() => setShowUploadForm(!showUploadForm)} style={{ marginBottom: 12 }}>
              {showUploadForm ? 'Cancel' : '+ Add Official Material'}
            </button>

            {showUploadForm && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch('/api/materials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(uploadForm),
                  });
                  
                  if (res.ok) {
                    setUploadForm({ subjectId: '', term: 'Midterm', type: 'official', title: '', description: '', url: '' });
                    setShowUploadForm(false);
                    await fetchMaterials(); // Added await so the list refreshes before the form closes
                    alert('Material added successfully!');
                  } else {
                    const errorData = await res.json();
                    alert('FAILED! Reason: ' + (errorData.error || 'Unknown error'));
                    console.log(errorData);
                  }
                } catch (error) {
                  console.error("JAVASCRIPT ERROR:", error);
                  alert('A JavaScript error occurred: ' + error.message);
                }
              }}>
                <div className="row2">
                  <div className="field">
                    <label>Subject</label>
                    <select className="input" required value={uploadForm.subjectId} onChange={e => setUploadForm({...uploadForm, subjectId: e.target.value})}>
                      <option value="">Select Subject...</option>
                      {subjectsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Term</label>
                    <select className="input" value={uploadForm.term} onChange={e => setUploadForm({...uploadForm, term: e.target.value})}>
                      <option value="Midterm">Midterm</option>
                      <option value="Finals">Finals</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Title</label>
                  <input className="input" required value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} placeholder="e.g. Chapter 1 Reviewer" />
                </div>
                <div className="field">
                  <label>Description (optional)</label>
                  <input className="input" value={uploadForm.description} onChange={e => setUploadForm({...uploadForm, description: e.target.value})} />
                </div>
                <div className="field">
                  <label>Google Drive Link (PDF or Folder)</label>
                  <input className="input" type="url" required value={uploadForm.url} onChange={e => setUploadForm({...uploadForm, url: e.target.value})} placeholder="https://drive.google.com/..." />
                </div>
                <button className="btn btn-primary" type="submit">Save Material</button>
              </form>
            )}
          </div>

          {/* EXISTING MATERIALS LIST */}
          {materials.length === 0 ? (
            <p className="note">No materials uploaded yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {materials.map((m) => (
                <div className="review-item" key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="rq">{m.title}</div>
                    <span className={`tag ${m.verified ? 'on' : 'off'}`} style={{ fontSize: '0.75rem' }}>
                      {m.verified ? 'Verified' : 'Pending Review'}
                    </span>
                  </div>
                  
                  <div className="note" style={{ marginBottom: 4 }}>
                    {m.description || 'No description provided.'}
                  </div>
                  
                  <div className="note" style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                    Uploaded by: <strong>{m.uploadedByName}</strong> · Type: {m.type}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--navy)', fontWeight: 600, fontSize: '.9rem', textDecoration: 'underline' }}>
                      Open Link ↗
                    </a>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!m.verified && (
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={async () => {
                            await fetch(`/api/materials/${m.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ verified: true })
                            });
                            fetchMaterials();
                          }} 
                        >
                          Approve
                        </button>
                      )}
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={async () => {
                          if (!confirm('Are you sure you want to delete this material?')) return;
                          await fetch(`/api/materials/${m.id}`, { method: 'DELETE' });
                          fetchMaterials();
                        }} 
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>
      )}

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
              placeholder='{ "title": "CCNA Exam", "subject": "Networking", "type": "Mock Examination", "date": "2024-11-24T09:00+08:00", "questions": [ ... ] }'
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
                    {ex.date ? new Date(ex.date).toLocaleString('en-US', { timeZone: 'Asia/Manila' }) : 'Unscheduled'} · {ex.count} items
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

function SubjectsPanel() {
  const [subjects, setSubjects] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', color: '#246b91' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/subjects', { cache: 'no-store' });
    const data = await res.json();
    setSubjects(data.subjects || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: '', text: '' });
    const res = await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg({ type: 'error', text: data.error || 'Could not create subject.' });
    } else {
      setForm({ name: '', code: '', color: '#246b91' });
      setMsg({ type: 'success', text: 'Subject created.' });
      load();
    }
    setBusy(false);
  }

  async function remove(id) {
    if (!confirm('Delete this subject and ALL its materials?')) return;
    await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <section className="card">
      <h2 style={{ margin: '0 0 14px', fontSize: '1.05rem', color: 'var(--navy)' }}>Manage Subjects</h2>
      {msg.text && <div className={msg.type === 'error' ? 'error' : 'success'}>{msg.text}</div>}
      
      <form onSubmit={add} style={{ marginBottom: 24 }}>
        <div className="row2">
          <div className="field">
            <label>Subject Name</label>
            <input className="input" value={form.name} required
                   placeholder="e.g. Social Science 1C"
                   onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Code (optional)</label>
            <input className="input" value={form.code}
                   placeholder="e.g. SS1C"
                   onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
        </div>
         <div className="field">
            <label>Color</label>
            <input type="color" className="input" value={form.color}
                   onChange={(e) => setForm({ ...form, color: e.target.value })}
                   style={{ padding: 4, height: 40 }} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Creating...' : 'Add Subject'}
        </button>
      </form>

      <h3 style={{ fontSize: '0.95rem', color: 'var(--navy)', marginBottom: 10 }}>Existing Subjects</h3>
      {subjects === null ? (
        <p className="note">Loading…</p>
      ) : subjects.length === 0 ? (
        <p className="note">No subjects yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {subjects.map((s) => (
            <div className="review-item" key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="rq" style={{ marginBottom: 2 }}>{s.name}</div>
                <div className="note">
                  {s.code ? `${s.code} · ` : ''}{s.materialCount} material{s.materialCount === 1 ? '' : 's'}
                </div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => remove(s.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </section>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '.8rem', color: 'var(--muted)' }}>
                  <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--navy)' }}>
                    MAYOR
                  </span>
                  <span>·</span>
                  <span>
                    {new Date(a.createdAt).toLocaleString('en-US', { month: 'long', day: 'numeric' })}{' '}
                    {new Date(a.createdAt).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <button className="btn btn-danger btn-sm" onClick={() => remove(a.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}

function StudentsPanel() {
  const [emails, setEmails] = useState('');
  const [password, setPassword] = useState('TSM2A-2026');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: '', text: '' });
    
    const list = emails.split(/[\n,]+/).map(e => e.trim()).filter(e => e.length > 0);

    try {
      const res = await fetch('/api/auth/create-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: list, defaultPassword: password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: `Successfully created ${data.count} accounts!` });
        setEmails('');
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to create accounts.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2 style={{ margin: '0 0 14px', fontSize: '1.05rem', color: 'var(--navy)' }}>Create Student Accounts</h2>
      {msg.text && <div className={msg.type === 'error' ? 'error' : 'success'}>{msg.text}</div>}
      
      <form onSubmit={handleCreate}>
        <div className="field">
          <label>Student Emails (Paste from Google Sheet)</label>
          <textarea 
            className="textarea" 
            style={{ minHeight: 150, fontFamily: 'monospace', fontSize: '.85rem' }}
            value={emails} 
            onChange={(e) => setEmails(e.target.value)} 
            placeholder="juan@school.edu.ph&#10;maria@school.edu.ph"
            required
          />
        </div>
        <div className="field">
          <label>Default Password</label>
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Creating...' : 'Create Accounts'}
        </button>
      </form>
    </section>
  );
}

function ScoresPanel() {
  const [items, setItems] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/scores?limit=200', { cache: 'no-store' });
    const data = await res.json();
    setItems(data.scores || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id) {
    if (!confirm('Remove this entry from the leaderboard?')) return;
    await fetch(`/api/scores/${id}`, { method: 'DELETE' });
    load();
  }

  async function clearAll() {
    if (!confirm('Delete ALL leaderboard entries? This cannot be undone.')) return;
    await fetch('/api/scores', { method: 'DELETE' });
    load();
  }

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--navy)' }}>Leaderboard entries</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}>Refresh ↻</button>
          <button className="btn btn-danger btn-sm" onClick={clearAll}>Clear all</button>
        </div>
      </div>

      {items === null ? (
        <p className="note">Loading…</p>
      ) : items.length === 0 ? (
        <p className="note">No scores submitted yet.</p>
      ) : (
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="table" style={{ minWidth: '600px' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Score</th>
                <th>%</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 700 }}>
                    {s.name} {s.isAnonymous && <span className="note">(Hidden)</span>}
                  </td>
                  <td>{s.score}/{s.total}</td>
                  <td style={{ fontWeight: 800, color: 'var(--navy)' }}>{s.percent}%</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(s.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
