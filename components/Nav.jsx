'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const PUBLIC_LINKS = [
  { href: '/', label: 'Hub' },
  { href: '/quiz', label: 'Assessments' },
  { href: '/resources', label: 'Resources' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export default function Nav() {
  const pathname = usePathname();
  const [session, setSession] = useState({
    loggedIn: false,
    isAdmin: false,
  });

  useEffect(() => {
    let alive = true;

    // Check BOTH student and admin status simultaneously
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()).catch(() => ({ loggedIn: false })),
      fetch('/api/admin/session').then((r) => r.json()).catch(() => ({ admin: false })),
    ]).then(([me, admin]) => {
      if (!alive) return;
      setSession({
        loggedIn: Boolean(me.loggedIn),
        isAdmin: Boolean(admin.admin),
      });
    });

    return () => {
      alive = false;
    };
  }, [pathname]);

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
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link${pathname === link.href ? ' active' : ''}`}
            >
              {link.label}
            </Link>
          ))}

          {/* Show Profile ONLY if logged in as a student */}
          {session.loggedIn && (
            <Link
              href="/profile"
              className={`nav-link${pathname === '/profile' ? ' active' : ''}`}
            >
              Profile
            </Link>
          )}

          {/* Show Admin ONLY if logged in as an admin */}
          {session.isAdmin && (
            <Link
              href="/admin"
              className={`nav-link${pathname === '/admin' ? ' active' : ''}`}
            >
              Admin
            </Link>
          )}

          {/* Show Login ONLY if not logged in as either */}
          {!session.loggedIn && !session.isAdmin && (
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
