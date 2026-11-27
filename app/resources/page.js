import Link from 'next/link';
import { listSubjects } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
  const subjects = await listSubjects();

  return (
    <>
      <header className="hero" style={{ marginBottom: 24 }}>
        <div className="eyebrow">TSM 2A · Study Materials</div>
        <h1>Study Resources</h1>
        <p>Reviewers and materials shared by the class, organized by subject.</p>
      </header>

      {subjects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>📚</div>
          <h3 style={{ margin: 0, color: 'var(--navy)' }}>No subjects yet</h3>
          <p className="note">An admin needs to create subjects first.</p>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {subjects.map((s) => (
            <Link href={`/resources/${s.id}`} key={s.id} className="tile">
              <div className="icon" style={{ 
                background: s.color + '20', 
                color: s.color,
                display: 'flex',          // Flex helps center perfectly
                alignItems: 'center',     // Vertical center
                justifyContent: 'center', // Horizontal center
                fontSize: s.code && s.code.length > 4 ? '0.65rem' : '0.85rem', // Shrink if it's 5+ chars
                fontWeight: 900,
                whiteSpace: 'nowrap',     // <--- THIS STOPS IT FROM WRAPPING TO A SECOND LINE
                padding: '0 4px',         // Little breathing room
                textTransform: 'uppercase'
              }}>
                {s.code || '📖'}
              </div>
              <h3>{s.name}</h3>
              <p>{s.materialCount} material{s.materialCount === 1 ? '' : 's'}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
