import Link from 'next/link';
import { listAnnouncements, listScores, listQuestions } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let questions = [];
  let announcements = [];
  let top = [];

  try {
    [questions, announcements, top] = await Promise.all([
      listQuestions(),
      listAnnouncements(),
      listScores(5),
    ]);
  } catch (err) {
    console.error('Home data error:', err);
  }

  const topics = [...new Set(questions.map((q) => q.topic))];

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
          <span className="pill">{topics.length} Topics</span>
          <span className="pill">Instant Explanations</span>
          <span className="pill">Class Leaderboard</span>
        </div>
      </header>

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
              <span className="note">
                Made by TSM 2A MAYOR · {new Date(a.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </section>

      {/* RECENTLY ADDED */}
      {questions.length > 0 && (
        <section className="card" style={{ marginBottom: '18px' }}>
          <h2 style={{ margin: '0 0 12px', color: 'var(--navy)', fontSize: '1.1rem' }}>✨ Recently Added</h2>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
            {questions.slice(-3).reverse().map(q => (
              <div key={q.id} style={{ minWidth: 200, padding: 12, border: '1px solid var(--line)', borderRadius: 8 }}>
                <div className="tag" style={{ fontSize: '.7rem', marginBottom: 4 }}>{q.quizTitle || q.topic}</div>
                <div style={{ fontWeight: 700, fontSize: '.9rem', lineHeight: 1.2 }}>{q.question.substring(0, 40)}...</div>
              </div>
            ))}
          </div>
        </section>
      )}

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
