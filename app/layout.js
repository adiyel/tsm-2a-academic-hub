import './globals.css';
import { Inter } from 'next/font/google';
import Nav from '@/components/Nav';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'TSM 2A Academic Hub',
  description: 'Practice quizzes, class leaderboard, and study resources for TSM 2A.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Nav />
        
        {/* Main content area */}
        <main className="wrap" style={{ flex: 1 }}>
          {children}
        </main>
        
        {/* GLOBAL WATERMARK / FOOTER */}
        <footer style={{
          textAlign: 'center',
          padding: '24px 18px',
          color: 'var(--muted)',
          fontSize: '.85rem',
          borderTop: '1px solid var(--line)',
          marginTop: '40px',
          background: 'white'
        }}>
          <div style={{ fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>
            TSM 2A Academic Hub
          </div>
          <div>
            Made by <strong>TSM 2A MAYOR</strong> · Maintained for the class of 2A
          </div>
        </footer>
      </body>
    </html>
  );
}
