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
  }, []);

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
          {isLoggedIn && (
            <Link
              href="/profile"
              className={`nav-link${pathname === '/profile' ? ' active' : ''}`}
            >
              Profile
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
