'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const LINKS = [
  { href: '/', label: 'Hub' },
  { href: '/quiz', label: 'Quizzes' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/admin', label: 'Admin' },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Ask the server if we have a valid session
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setIsLoggedIn(data.loggedIn))
      .catch(() => setIsLoggedIn(false));
  }, [pathname]); // Re-check whenever the page changes

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    router.push('/login');
  };

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
          
          {/* Only show Profile and Logout if logged in */}
          {isLoggedIn && (
            <>
              <Link
                href="/profile"
                className={`nav-link${pathname === '/profile' ? ' active' : ''}`}
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
