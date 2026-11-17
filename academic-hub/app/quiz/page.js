import Quiz from '@/components/Quiz';

export const metadata = { title: 'Practice Quiz · TSM 2A Academic Hub' };

export default function QuizPage() {
  return (
    <>
      <header className="hero" style={{ marginBottom: 18 }}>
        <div className="eyebrow">CC4 · Final Term</div>
        <h1>Practice Quiz</h1>
        <p>Choose one answer per item. Your first try counts toward the leaderboard.</p>
      </header>
      <Quiz />
    </>
  );
}
