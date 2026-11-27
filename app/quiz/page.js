import Link from 'next/link';
import { listQuizzes } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function QuizMenuPage() {
  const quizzes = await listQuizzes();
  const now = new Date();

  // Sort chronologically
  const sorted = quizzes.sort((a, b) => {
    if (!a.date && !b.date) return a.title.localeCompare(b.title);
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  // Group by category
  const upcoming = sorted.filter(q => q.date && new Date(q.date) >= now);
  const practice = sorted.filter(q => !q.date);
  const archived = sorted.filter(q => q.date && new Date(q.date) < now);

  // Group upcoming by Date String (e.g., "Tuesday, November 24")
  const groupedByDate = {};
  upcoming.forEach(q => {
    const dateStr = new Date(q.date).toLocaleDateString('en-US', { 
      timeZone: 'Asia/Manila',
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    if (!groupedByDate[dateStr]) groupedByDate[dateStr] = [];
    groupedByDate[dateStr].push(q);
  });

  // Nearest exams for the countdown banner
  const nextExamDate = upcoming[0]?.date;
  const nextExams = upcoming.filter(q => q.date === nextExamDate);
  const daysUntil = nextExamDate 
    ? Math.ceil((new Date(nextExamDate) - now) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      <header className="hero" style={{ marginBottom: 18 }}>
        <div className="eyebrow">TSM 2A Assessments</div>
        <h1>Quizzes & Mock Exams</h1>
        <p>Prepare for upcoming scheduled exams or practice anytime with general quizzes.</p>
      </header>

      {/* COUNTDOWN WIDGET */}
      {nextExams.length > 0 && daysUntil !== null && daysUntil >= 0 && (
        <div className="card" style={{ background: 'var(--navy)', color: 'white', marginBottom: 24, textAlign: 'center', border: '1px solid #246b91' }}>
          <div className="eyebrow" style={{ color: '#b8d9e9' }}>Next Scheduled Event{daysUntil === 0 ? ' (TODAY)' : ''}</div>
          
          <div style={{ margin: '12px 0' }}>
            {nextExams.map(ex => (
              <h2 key={ex.title} style={{ margin: '8px 0', fontSize: '1.4rem' }}>{ex.title}</h2>
            ))}
          </div>

          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '-1px' }}>
            {daysUntil === 0 ? 'TODAY' : `${daysUntil} Day${daysUntil === 1 ? '' : 's'} Left`}
          </div>
          <p style={{ margin: 0, opacity: 0.8, fontWeight: 'bold' }}>
            {new Date(nextExamDate).toLocaleString('en-US', { 
              timeZone: 'Asia/Manila',
              weekday: 'long', month: 'long', day: 'numeric' 
            })}
          </p>
        </div>
      )}

      {/* SCHEDULED ASSESSMENTS (Grouped by Date Folders) */}
      {upcoming.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--navy)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            📅 Scheduled Assessments
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(groupedByDate).map(([dateStr, exams]) => (
              <details key={dateStr} open style={{ background: 'var(--paper)', borderRadius: 12, border: '1px solid var(--line)', overflow: 'hidden' }}>
                <summary style={{ padding: '14px 16px', cursor: 'pointer', fontWeight: 800, color: 'var(--navy)', background: 'var(--bg)', borderBottom: '1px solid var(--line)' }}>
                  📁 {dateStr}
                </summary>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {exams.map(q => (
                    <QuizCard key={q.title} quiz={q} />
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* UNSCHEDULED PRACTICE */}
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

      {/* ARCHIVED (Past Dates) */}
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

// QuizCard displays Title, Subject, Type, and Number of Questions
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
    <Link href={`/quiz/${encodeURIComponent(quiz.title)}`} style={{ 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      padding: '12px', textDecoration: 'none', color: 'inherit',
      border: '1px solid var(--line)', borderRadius: 10,
      borderLeft: `4px solid ${borderColor}`,
      transition: 'background 0.15s',
      background: 'var(--paper)'
    }}>
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <span className="tag" style={{ background: tagBg, color: tagColor }}>
            {icon} {quiz.type}
          </span>
          <span className="note" style={{ fontWeight: 700 }}>{quiz.topic}</span>
        </div>
        
        <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--navy)' }}>{quiz.title}</h3>
        
        {quiz.date && (
          <div className="note" style={{ marginTop: 4, fontWeight: 600 }}>
            🕒 {new Date(quiz.date).toLocaleTimeString('en-US', { 
              timeZone: 'Asia/Manila',
              hour: 'numeric', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'right', minWidth: '60px' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy)' }}>{quiz.count}</div>
        <div className="note" style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Items</div>
      </div>
    </Link>
  );
}
