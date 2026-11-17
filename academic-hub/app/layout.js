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
      <body className={inter.className}>
        <Nav />
        <main className="wrap">{children}</main>
        <div className="footer">TSM 2A Academic Hub · Built for review and practice</div>
      </body>
    </html>
  );
}
