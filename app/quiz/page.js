import Link from 'next/link';
import { listQuestions } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function QuizMenuPage() {
  const questions = await listQuestions();
  
  // Group questions by topic
  const topics = [...new Set(questions.map((q) => q.topic))];

  return (
    <>
      <header className="hero" style={{ marginBottom: 18 }}>
        <div className="eyebrow">Available Quizzes</div>
        <h1>Select a Subject</h1>
        <p>Choose a topic to begin your practice. New subjects will appear here when an admin adds them.</p>
      </header>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
        {topics.map((topic) => {
          const count = questions.filter(q => q.topic === topic).length;
          return (
            <Link href={`/quiz/${encodeURIComponent(topic)}`} key={topic} className="tile">
              <div className="icon">📚</div>
              <h3>{topic}</h3>
              <p>{count} practice items available</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
