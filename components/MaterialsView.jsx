'use client';

import { useEffect, useState } from 'react';
import MaterialCard from './MaterialCard';
import AddMaterialForm from './AddMaterialForm';

export default function MaterialsView({ initialMaterials, subjectId, term }) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [me, setMe] = useState({ loggedIn: false, isAdmin: false, userId: null });

  async function reload() {
    const res = await fetch(`/api/materials?subjectId=${subjectId}&term=${term}`);
    const data = await res.json();
    setMaterials(data.materials || []);
  }

  useEffect(() => {
    // Determine current user
    fetch('/api/auth/me').then(r => r.json()).then(async (data) => {
      if (!data.loggedIn) {
        setMe({ loggedIn: false, isAdmin: false, userId: null });
        return;
      }
      const adminRes = await fetch('/api/admin/session').then(r => r.json()).catch(() => ({}));
      setMe({ loggedIn: true, isAdmin: Boolean(adminRes.admin), userId: data.userId || null });
    });
  }, []);

  const official = materials.filter(m => m.type === 'official');
  const community = materials.filter(m => m.type === 'community');

  return (
    <>
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.15rem', color: 'var(--navy)', marginBottom: 12 }}>
          📌 Official Materials
        </h2>
        {official.length === 0 ? (
          <p className="note">No official materials yet.</p>
        ) : (
          official.map(m => (
            <MaterialCard
              key={m.id}
              material={m}
              canDelete={me.isAdmin}
              canVerify={false}
              onDeleted={reload}
            />
          ))
        )}
      </section>

      <section style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: '1.15rem', color: 'var(--navy)', margin: 0 }}>
            👥 Community Reviewers
          </h2>
        </div>

        {me.loggedIn && (
          <AddMaterialForm subjectId={subjectId} term={term} onAdded={reload} />
        )}

        {!me.loggedIn && (
          <p className="note" style={{ marginBottom: 12 }}>
            Log in to add your own reviewer.
          </p>
        )}

        {community.length === 0 ? (
          <p className="note">No community reviewers yet — be the first to add one.</p>
        ) : (
          community.map(m => (
            <MaterialCard
              key={m.id}
              material={m}
              canDelete={me.isAdmin || m.uploadedBy === me.userId}
              canVerify={me.isAdmin}
              onDeleted={reload}
              onVerified={reload}
            />
          ))
        )}
      </section>
    </>
  );
}
