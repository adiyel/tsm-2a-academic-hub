import Link from 'next/link';
import { listAnnouncements, listScores, listQuestions, listQuizzes } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let questions = [];
  let announcements = [];
  let top = [];
  let quizzes = [];

  try {
    [questions, announcements, top, quizzes] = await Promise.all([
      listQuestions(),
      listAnnouncements(),
      listScores(5),
      listQuizzes(),
    ]);
  } catch (err) {
    console.error('Home data error:', err);
  }

  const now = new Date();

  // 1. CALCULATE UPCOMING EXAM COUNTDOWN
  const upcomingQuizzes = quizzes
    .filter(q => q.date && new Date(q.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Find ALL exams happening on the nearest date
  const nextExamDate = upcomingQuizzes[0]?.date;
  const nextExams = upcomingQuizzes.filter(q => q.date === nextExamDate);
  
  const daysUntil = nextExamDate 
    ? Math.ceil((new Date(nextExamDate) - now) / (1000 * 60 * 60 * 24))
    : null;

  // 2. GET RECENTLY ADDED
  const recentlyAdded = quizzes
    .sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    })
    .slice(0, 3);

  return (
    <>
      <header className="hero" style={{ marginBottom: '18px' }}>
        <div className="eyebrow">TSM 2A · Academic Hub</div>
        <h1>Study together. Track your progress. Top the leaderboard.</h1>
        <p>
          Practice the items, review every explanation, then post your
          first-try score and see how you rank against the class.
        </p>
        <div className="pills">
          <span className="pill">{questions.length} Practice Items</span>
          <span className="pill">Instant Explanations</span>
          <span className="pill">Class Leaderboard</span>
        </div>
      </header>

      {/* EXAM COUNTDOWN BANNER (Shows all exams on the same date) */}
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
            {new Date(nextExamDate).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <Link href="/quiz" className="btn btn-ghost btn-sm" style={{ marginTop: 12, background: 'white', color: 'var(--navy)' }}>
            Review Material →
          </Link>
        </div>
      )}

      {/* ANNOUNCEMENTS */}
      <section className="card" style={{ marginBottom: '18px', borderLeft: '4px solid var(--blue)' }}>
        <h2 style={{ margin: '0 0 12px', color: 'var(--navy)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📢 Announcements
        </h2>
        {announcements.length === 0 ? (
          <p className="note">No announcements yet.</p>
        ) : (
          announcements.slice(0, 4).map((a) => (
            <div key={a.id} style={{ padding: '12px 0', borderBottom: '1px solid #eef4f7' }}>
              <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: '1.1rem' }}>
                {a.pinned ? '📌 ' : ''}
                {a.title}
              </div>
              <p style={{ margin: '4px 0', color: '#40576a', fontSize: '.95rem' }}>{a.body}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '.8rem', color: 'var(--muted)' }}>
                <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--navy)' }}>
                  MAYOR
                </span>
                <span>·</span>
                <span>
                  {new Date(a.createdAt).toLocaleString('en-US', { month: 'long', day: 'numeric' })}{' '}
                  {new Date(a.createdAt).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </section>

      {/* RECENTLY ADDED */}
      {recentlyAdded.length > 0 && (
        <section className="card" style={{ marginBottom: '18px' }}>
          <h2 style={{ margin: '0 0 12px', color: 'var(--navy)', fontSize: '1.1rem' }}>✨ Recently Added Assessments</h2>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
            {recentlyAdded.map(q => (
              <Link href={`/quiz/${encodeURIComponent(q.title)}`} key={q.title} style={{ 
                minWidth: 220, padding: 12, border: '1px solid var(--line)', borderRadius: 8, textDecoration: 'none', color: 'inherit', background: 'var(--bg)'
              }}>
                <div className="tag" style={{ fontSize: '.7rem', marginBottom: 6 }}>{q.type || 'Mock Quiz'}</div>
                <div style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--navy)', lineHeight: 1.2, marginBottom: 4 }}>
                  {q.title}
                </div>
                <div className="note" style={{ fontSize: '.8rem' }}>{q.topic} · {q.count} items</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* NAVIGATION TILES */}
      <div className="grid">
        <Link href="/quiz" className="tile">
          <div className="icon">📝</div>
          <h3>Quizzes & Mock Exams</h3>
          <p>Take assessments on specific topics with instant explanations.</p>
        </Link>
        <Link href="/leaderboard" className="tile">
          <div className="icon">🏆</div>
          <h3>Leaderboard</h3>
          <p>See the top first-try scores in TSM 2A and where you stand.</p>
        </Link>
        <Link href="/admin" className="tile">
          <div className="icon">🔐</div>
          <h3>Admin</h3>
          <p>Manage questions, announcements, and leaderboard entries.</p>
        </Link>
      </div>

      {/* TOP 5 LEADERBOARD */}
      <section className="card">
        <h2 style={{ margin: '0 0 12px', color: 'var(--navy)', fontSize: '1.1rem' }}>
          Top 5 this term
        </h2>
        {top.length === 0 ? (
          <p className="note">No scores submitted yet — be the first.</p>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="table" style={{ minWidth: '500px' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Score</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {top.map((s, i) => (
                  <tr key={s.id}>
                    <td><span className={`rank g${i + 1}`}>{i + 1}</span></td>
                    <td style={{ fontWeight: 700 }}>
                      {s.isAnonymous ? 'Anonymous Student' : s.name}
                    </td>
                    <td>{s.score}/{s.total}</td>
                    <td style={{ fontWeight: 800, color: 'var(--navy)' }}>{s.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <Link href="/leaderboard" className="btn btn-ghost btn-sm">View full leaderboard →</Link>
        </div>
      </section>
    </>
  );
}
