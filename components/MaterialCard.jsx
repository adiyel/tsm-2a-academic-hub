'use client';

import { useState } from 'react';

export default function MaterialCard({ material, canDelete, canVerify, onDeleted, onVerified }) {
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [verified, setVerified] = useState(material.verified);

  const domain = (() => {
    try { return new URL(material.url).hostname.replace('www.', ''); }
    catch { return 'link'; }
  })();

  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  });

  async function handleDelete() {
    if (!confirm('Delete this material?')) return;
    setDeleting(true);
    const res = await fetch(`/api/materials/${material.id}`, { method: 'DELETE' });
    if (res.ok) onDeleted();
    setDeleting(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(material.url);
    setCopying(true);
    setTimeout(() => setCopying(false), 1500);
  }

  async function handleVerify() {
    const next = !verified;
    const res = await fetch(`/api/materials/${material.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: next }),
    });
    if (res.ok) {
      setVerified(next);
      onVerified?.();
    }
  }

  return (
    <div style={{
      padding: 14, border: '1px solid var(--line)', borderRadius: 12,
      background: 'var(--paper)', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <span className="tag" style={{ background: 'var(--sky)', color: 'var(--blue)' }}>
              🔗 {domain}
            </span>
            {verified && (
              <span className="tag" style={{ background: 'var(--greenbg)', color: 'var(--green)' }}>
                ✓ Verified
              </span>
            )}
          </div>
          <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--navy)' }}>{material.title}</h4>
          {material.description && (
            <p style={{ margin: '4px 0', color: 'var(--muted)', fontSize: '.88rem' }}>
              {material.description}
            </p>
          )}
          <div className="note" style={{ marginTop: 6, fontSize: '.78rem' }}>
            by {material.uploadedByName || 'Anonymous'} · {fmtDate(material.createdAt)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <a href={material.url} target="_blank" rel="noopener noreferrer"
             className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
            Open →
          </a>
          <button onClick={handleCopy} className="btn btn-ghost btn-sm"
                  style={{ fontSize: '.75rem', padding: '4px 8px' }}>
            {copying ? '✓ Copied' : '🔗 Copy link'}
          </button>
          {canVerify && (
            <button onClick={handleVerify} className="btn btn-ghost btn-sm"
                    style={{ fontSize: '.75rem', padding: '4px 8px' }}>
              {verified ? 'Unverify' : '✓ Verify'}
            </button>
          )}
          {canDelete && (
            <button onClick={handleDelete} disabled={deleting}
                    className="btn btn-danger btn-sm"
                    style={{ fontSize: '.75rem', padding: '4px 8px' }}>
              {deleting ? '...' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
