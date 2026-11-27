'use client';

import { useState } from 'react';

export default function AddMaterialForm({ subjectId, term, onAdded }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', url: '' });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');

    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, term, subjectId }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Could not add material.');
      setBusy(false);
      return;
    }

    setForm({ title: '', description: '', url: '' });
    setOpen(false);
    setBusy(false);
    onAdded();
  }

  if (!open) {
    return (
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)} style={{ marginBottom: 12 }}>
        + Add your reviewer
      </button>
    );
  }

  return (
    <form onSubmit={submit} style={{
      padding: 16, border: '1px solid var(--line)', borderRadius: 12,
      background: 'var(--bg)', marginBottom: 14,
    }}>
      {error && <div className="error" style={{ fontSize: '.85rem', padding: '8px 12px' }}>{error}</div>}

      <div className="field">
        <label>Title</label>
        <input className="input" value={form.title} required maxLength={120}
               placeholder="e.g. My condensed SS1C notes"
               onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>

      <div className="field">
        <label>Description (optional)</label>
        <input className="input" value={form.description} maxLength={300}
               placeholder="One line about what this covers"
               onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <div className="field">
        <label>Link (Drive, Canva, Notion, etc.)</label>
        <input className="input" type="url" value={form.url} required
               placeholder="https://drive.google.com/..."
               onChange={(e) => setForm({ ...form, url: e.target.value })} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? 'Uploading...' : 'Upload'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); setError(''); }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
