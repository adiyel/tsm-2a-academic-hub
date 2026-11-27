import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listSubjects, listMaterials } from '@/lib/db';
import MaterialsView from '@/components/MaterialsView';

export const dynamic = 'force-dynamic';

export default async function TermPage({ params }) {
  const { subject: subjectId, term } = await params;

  if (!['midterm', 'finals'].includes(term)) notFound();

  const subjects = await listSubjects();
  const subject = subjects.find(s => s.id === Number(subjectId));
  if (!subject) notFound();

  const materials = await listMaterials({ subjectId: subject.id, term });

  return (
    <>
      <Link href={`/resources/${subject.id}`} className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
        ← {subject.name}
      </Link>

      <header className="hero" style={{ marginBottom: 24 }}>
        <div className="eyebrow">{subject.code || 'Subject'} · {term === 'midterm' ? 'Midterm' : 'Finals'}</div>
        <h1>{subject.name}</h1>
        <p>Study materials for this term.</p>
      </header>

      <MaterialsView
        initialMaterials={materials}
        subjectId={subject.id}
        term={term}
      />
    </>
  );
}
