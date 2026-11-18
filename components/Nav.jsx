'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const LINKS = [
  { href: '/', label: 'Hub' },
  { href: '/quiz', label: 'Quizzes' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/admin', label: 'Admin' },
];

export default function Nav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if student session cookie exists
    const hasCookie = document.cookie.includes('student_session=');
    setIsLoggedIn(hasCookie);
  }, [pathname]); // <--- This re-checks every time the page changes

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">2A</span>
          <span className="brand-text">
            Academic Hub
            <small>TSM 2A</small>
          </span>
        </Link>
        <div className="nav-links">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link${pathname === link.href ? ' active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
          
          {/* Only show these if the user is logged in */}
          {isLoggedIn && (
            <Link
              href="/profile"
              className={`nav-link${pathname === '/profile' ? ' active' : ''}`}
            >
              Profile
            </Link>
          )}
          {isLoggedIn && (
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
              className="nav-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
            >
              Logout
            </button>
          )}
          {!isLoggedIn && (
            <Link
              href="/login"
              className={`nav-link${pathname === '/login' ? ' active' : ''}`}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
