'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
    } else {
      if (isSignUp) {
        // Auto-login after signup
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
      }
      router.push('/quiz');
      router.refresh();
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }} className="card">
      <h2 style={{ marginBottom: 20 }}>{isSignUp ? 'Student Sign Up' : 'Student Login'}</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleAuth}>
        <div className="field">
          <label>Student Email</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@your-school.edu.ph" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }}>
          {isSignUp ? 'Create Account' : 'Log In'}
        </button>
      </form>
      <div style={{ textAlign: 'center' }}>
        <button onClick={() => setIsSignUp(!isSignUp)} className="btn btn-ghost" style={{ fontSize: '.85rem' }}>
          {isSignUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
        </button>
      </div>
    </div>
  );
}
