import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listSubjects, listMaterials } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function SubjectPage({ params }) {
  const { subject: subjectId } = await params;
  const subjects = await listSubjects();
  const subject = subjects.find(s => s.id === Number(subjectId));

  if (!subject) notFound();

  const [midtermCount, finalsCount] = await Promise.all([
    listMaterials({ subjectId: subject.id, term: 'midterm' }),
    listMaterials({ subjectId: subject.id, term: 'finals' }),
  ]);

  return (
    <>
      <Link href="/resources" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
        ← All subjects
      </Link>

      <header className="hero" style={{ marginBottom: 24 }}>
        <div className="eyebrow">{subject.code || 'Subject'}</div>
        <h1>{subject.name}</h1>
        <p>Choose a term to view materials.</p>
      </header>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Link href={`/resources/${subject.id}/midterm`} className="tile">
          <div className="icon">📘</div>
          <h3>Midterm</h3>
          <p>{midtermCount.length} material{midtermCount.length === 1 ? '' : 's'}</p>
        </Link>
        <Link href={`/resources/${subject.id}/finals`} className="tile">
          <div className="icon">📗</div>
          <h3>Finals</h3>
          <p>{finalsCount.length} material{finalsCount.length === 1 ? '' : 's'}</p>
        </Link>
      </div>
    </>
  );
}
