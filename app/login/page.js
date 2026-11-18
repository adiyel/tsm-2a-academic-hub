'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Invalid email or password.');
    } else {
      router.push('/quiz');
      router.refresh();
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }} className="card">
      <h2 style={{ marginBottom: 20, color: 'var(--navy)' }}>Student Login</h2>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleLogin}>
        <div className="field">
          <label>Student Email</label>
          <input 
            type="email" 
            className="input" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="you@your-school.edu.ph" 
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input 
            type="password" 
            className="input" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: 16 }}>
          Log In
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '.85rem', color: 'var(--muted)' }}>
        Don't have an account yet? <br />
        <a 
          href="https://forms.gle/zTnVMzy31J4A642k9" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: 'var(--blue)', fontWeight: 'bold', textDecoration: 'underline' }}
        >
          Fill out the registration form here.
        </a>
      </div>
    </div>
  );
}
