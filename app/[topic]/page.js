import Quiz from '@/components/Quiz';

export default function TopicQuizPage({ params }) {
  const topic = decodeURIComponent(params.topic);
  return (
    <>
      <header className="hero" style={{ marginBottom: 18 }}>
        <div className="eyebrow">Practice Quiz</div>
        <h1>{topic}</h1>
        <p>Choose one answer per item. Your first try counts toward the leaderboard.</p>
      </header>
      <Quiz topic={topic} />
    </>
  );
}
