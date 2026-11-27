'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/providers/ThemeProvider';

export default function ProfilePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const [data, setData] = useState(null);
  const [name, setName] = useState('');
  const [alwaysAnon, setAlwaysAnon] = useState(false);
  
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => {
        if (r.status === 401) router.push('/login');
        return r.json();
      })
      .then((d) => {
        if (d.user) {
          setData(d);
          setName(d.user.display_name || d.user.email.split('@')[0]);
          setAlwaysAnon(d.user.always_anonymous);
        }
      });
  }, [router]);

  async function saveName(e) {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: name, alwaysAnonymous: alwaysAnon }),
    });
    if (res.ok) setMsg({ type: 'success', text: 'Profile updated!' });
    else setMsg({ type: 'error', text: 'Failed to update profile.' });
  }

  async function savePassword(e) {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    const res = await fetch('/api/profile/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
    });
    const d = await res.json();
    if (res.ok) {
      setMsg({ type: 'success', text: 'Password changed!' });
      setCurrentPass(''); setNewPass('');
    } else {
      setMsg({ type: 'error', text: d.error || 'Failed.' });
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  if (!data) return <p className="note">Loading profile...</p>;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <header className="hero" style={{ marginBottom: 18 }}>
        <div className="eyebrow">Student Account</div>
        <h1>Your Profile</h1>
        <p>{data.user.email}</p>
      </header>

      {msg.text && <div className={msg.type === 'error' ? 'error' : 'success'}>{msg.text}</div>}

      {/* DARK MODE TOGGLE */}
      <section className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--navy)' }}>Appearance</h3>
            <p className="note" style={{ margin: '4px 0 0' }}>Switch between Light and Dark mode.</p>
          </div>
          <button 
            className="btn btn-ghost" 
            onClick={toggleTheme}
            style={{ fontSize: '1.2rem', padding: '8px 16px' }}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </section>

      {/* ACCOUNT INFO */}
      <section className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ margin: '0 0 14px', color: 'var(--navy)' }}>Display Settings</h3>
        <form onSubmit={saveName}>
          <div className="field">
            <label>Display Name</label>
            <input 
              className="input" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. Juan D."
              required
            />
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '.9rem', marginBottom: 16 }}>
            <input 
              type="checkbox" 
              checked={alwaysAnon} 
              onChange={(e) => setAlwaysAnon(e.target.checked)} 
              style={{ width: 18, height: 18 }}
            />
            Always appear as "Anonymous Student" on the leaderboard
          </label>
          <button className="btn btn-primary" type="submit">Save Profile</button>
        </form>
      </section>

      {/* PASSWORD CHANGE */}
      <section className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ margin: '0 0 14px', color: 'var(--navy)' }}>Change Password</h3>
        <form onSubmit={savePassword}>
          <div className="field">
            <label>Current Password</label>
            <input type="password" className="input" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} required />
          </div>
          <div className="field">
            <label>New Password</label>
            <input type="password" className="input" value={newPass} onChange={(e) => setNewPass(e.target.value)} required />
          </div>
          <button className="btn btn-ghost" type="submit">Update Password</button>
        </form>
      </section>

      {/* STATS */}
      <section className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ margin: '0 0 14px', color: 'var(--navy)' }}>Your Statistics</h3>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 12 }}>
            <div className="note">Quizzes Taken</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--navy)' }}>{data.stats.total_quizzes}</div>
          </div>
          <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 12 }}>
            <div className="note">Avg Accuracy</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--blue)' }}>{data.stats.average_accuracy}%</div>
          </div>
          <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 12 }}>
            <div className="note">Highest Score</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--green)' }}>{data.stats.highest_score}</div>
          </div>
          <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 12 }}>
            <div className="note">Most Recent</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--gold)' }}>{data.stats.recent_score || '—'}</div>
          </div>
        </div>

        {data.recent.length > 0 && (
          <>
            <h4 style={{ margin: '20px 0 10px', color: 'var(--navy)' }}>Recent Attempts</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.recent.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, background: 'var(--bg)', borderRadius: 8 }}>
                  <span style={{ fontWeight: 700 }}>{r.score} / {r.total}</span>
                  <span className="note">
                    {new Date(r.created_at).toLocaleDateString('en-US', { timeZone: 'Asia/Manila' })}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* LOGOUT BUTTON */}
      <section className="card" style={{ marginBottom: 18, textAlign: 'center', background: 'var(--redbg)', borderColor: 'var(--red)' }}>
        <p className="note" style={{ color: 'var(--red)', marginBottom: 12 }}>
          Logging out will clear your session. You will need to enter your credentials again.
        </p>
        <button 
          onClick={handleLogout}
          className="btn" 
          style={{ background: 'var(--red)', color: 'white', width: '100%' }}
        >
          Logout
        </button>
      </section>
    </div>
  );
}
