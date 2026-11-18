import './globals.css';
import { Inter } from 'next/font/google';
import Nav from '@/components/Nav';
import { ThemeProvider } from '@/app/providers/ThemeProvider';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'TSM 2A Academic Hub',
  description: 'Practice quizzes, class leaderboard, and study resources for TSM 2A.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <ThemeProvider>
          <Nav />
          <main className="wrap" style={{ flex: 1 }}>
            {children}
          </main>
          <footer style={{ textAlign: 'center', padding: '24px 18px', color: 'var(--muted)', fontSize: '.85rem', borderTop: '1px solid var(--line)', marginTop: '40px', background: 'var(--paper)' }}>
            <div style={{ fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>
              TSM 2A Academic Hub
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800 }}>
              MAYOR
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
