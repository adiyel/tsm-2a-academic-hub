'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function LeaderboardPage() {
  const [scores, setScores] = useState(null);
  const [error, setError] = useState('');
  const [me, setMe] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/scores?limit=100', { cache: 'no-store' });
      const data = await res.json();
      setScores(data.scores || []);
    } catch {
      setError('Could not load the leaderboard.');
      setScores([]);
    }
  }, []);

  useEffect(() => {
    setMe(localStorage.getItem('tsm2a_name') || '');
    load();
  }, [load]);

  return (
    <>
      <header className="hero" style={{ marginBottom: 18 }}>
        <div className="eyebrow">TSM 2A · Class Standing</div>
        <h1>Leaderboard</h1>
        <p>Ranked by first-try accuracy, then by score, then by fastest completion.</p>
      </header>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--navy)' }}>Top 100</h2>
          <button className="btn btn-ghost btn-sm" onClick={load}>Refresh ↻</button>
        </div>

        {error && <div className="error">{error}</div>}

        {scores === null ? (
          <p className="note">Loading scores…</p>
        ) : scores.length === 0 ? (
          <p className="note">No scores yet. <Link href="/quiz">Be the first to take the quiz →</Link></p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Score</th>
                <th>%</th>
                <th>Time</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => (
                <tr key={s.id} className={me && s.name === me ? 'me' : ''}>
                  <td><span className={`rank${i < 3 ? ` g${i + 1}` : ''}`}>{i + 1}</span></td>
                  <td style={{ fontWeight: 700 }}>{s.name}</td>
                  <td>{s.score}/{s.total}</td>
                  <td style={{ fontWeight: 800, color: 'var(--navy)' }}>{s.percent}%</td>
                  <td>{formatTime(s.durationSeconds)}</td>
                  <td className="note">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/quiz" className="btn btn-primary">Take the quiz →</Link>
          <Link href="/" className="btn btn-ghost">Back to hub</Link>
        </div>
      </section>
    </>
  );
}
