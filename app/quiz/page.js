import Link from 'next/link';
import { listQuizzes } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function QuizMenuPage() {
  const quizzes = await listQuizzes();
  const now = new Date();

  const sorted = quizzes.sort((a, b) => {
    if (!a.date && !b.date) return a.title.localeCompare(b.title);
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  const upcoming = sorted.filter(q => q.date && new Date(q.date) >= now);
  const practice = sorted.filter(q => !q.date);
  const archived = sorted.filter(q => q.date && new Date(q.date) < now);

  const nearestExam = upcoming[0];
  const daysUntil = nearestExam 
    ? Math.ceil((new Date(nearestExam.date) - now) / (1000 * 60 * 60 * 24))
    : null;

  const fmtDate = (iso) => {
    if (!iso) return 'Unscheduled';
    return new Date(iso).toLocaleString('en-US', { 
      weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
    });
  };

  return (
    <>
      <header className="hero" style={{ marginBottom: 18 }}>
        <div className="eyebrow">TSM 2A Assessments</div>
        <h1>Quizzes & Mock Exams</h1>
        <p>Prepare for upcoming scheduled exams or practice anytime with general quizzes.</p>
      </header>

      {nearestExam && daysUntil !== null && daysUntil >= 0 && (
        <div className="card" style={{ background: 'var(--navy)', color: 'white', marginBottom: 24, textAlign: 'center', border: '1px solid #246b91' }}>
          <div className="eyebrow" style={{ color: '#b8d9e9' }}>Next Scheduled Event</div>
          <h2 style={{ margin: '8px 0', fontSize: '1.5rem' }}>{nearestExam.title}</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '-1px' }}>
            {daysUntil === 0 ? 'TODAY' : `${daysUntil} Day${daysUntil === 1 ? '' : 's'} Left`}
          </div>
          <p style={{ margin: 0, opacity: 0.8, fontWeight: 'bold' }}>{fmtDate(nearestExam.date)}</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--navy)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            📅 Scheduled Assessments
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcoming.map(q => (
              <QuizCard key={q.title} quiz={q} />
            ))}
          </div>
        </section>
      )}

      {practice.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--navy)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            📝 General Practice Quizzes
          </h2>
          <div className="grid">
            {practice.map(q => (
              <QuizCard key={q.title} quiz={q} isPractice />
            ))}
          </div>
        </section>
      )}

      {archived.length > 0 && (
        <section>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 800, color: 'var(--muted)', marginBottom: 12, fontSize: '1.1rem' }}>
              🗄️ Archived Assessments (Past)
            </summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12, opacity: 0.7 }}>
              {archived.map(q => (
                <QuizCard key={q.title} quiz={q} />
              ))}
            </div>
          </details>
        </section>
      )}

      {quizzes.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>📭</div>
          <h3 style={{ margin: 0, color: 'var(--navy)' }}>No assessments yet</h3>
          <p className="note">Check back later when your instructor uploads exams or practice quizzes.</p>
        </div>
      )}
    </>
  );
}

function QuizCard({ quiz, isPractice }) {
  const isExam = quiz.type === 'Mock Examination';
  
  let borderColor = 'var(--blue)';
  let tagBg = 'var(--sky)';
  let tagColor = 'var(--blue)';
  let icon = '📝';

  if (isExam) {
    borderColor = 'var(--red)';
    tagBg = 'var(--redbg)';
    tagColor = 'var(--red)';
    icon = '🎓';
  } else if (isPractice) {
    borderColor = 'var(--green)';
    tagBg = 'var(--greenbg)';
    tagColor = 'var(--green)';
    icon = '💡';
  }

  return (
    <Link href={`/quiz/${encodeURIComponent(quiz.title)}`} className="card" style={{ 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      padding: '16px', textDecoration: 'none', color: 'inherit',
      borderLeft: `4px solid ${borderColor}`,
      transition: 'transform 0.15s',
    }}>
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <span className="tag" style={{ background: tagBg, color: tagColor }}>
            {icon} {quiz.type}
          </span>
          <span className="note" style={{ fontWeight: 700 }}>{quiz.topic}</span>
        </div>
        
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--navy)' }}>{quiz.title}</h3>
        
        <div className="note" style={{ marginTop: 4, fontWeight: 600 }}>
          {quiz.date 
            ? new Date(quiz.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) 
            : 'No scheduled date'}
        </div>
      </div>

      <div style={{ textAlign: 'right', minWidth: '60px' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy)' }}>{quiz.count}</div>
        <div className="note" style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Items</div>
      </div>
    </Link>
  );
}
