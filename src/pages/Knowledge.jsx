import { useEffect, useState } from 'react';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://amanex-production.up.railway.app';

async function fetchKnowledge() {
  const token = localStorage.getItem('amanex_token');
  const res = await fetch(`${BASE_URL}/api/knowledge`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Fehler: ' + res.status);
  return res.json();
}

function typeMeta(category) {
  const c = (category || '').toLowerCase();
  if (c.includes('schlecht') && c.includes('prognose')) return { label: 'Schlechte Prognose', cls: 'b-red' };
  if (c.includes('timing')) return { label: 'Schlechtes Timing', cls: 'b-yellow' };
  if (c.includes('schock') || c.includes('extern')) return { label: 'Externer Schock', cls: 'b-blue' };
  if (c.includes('gut')) return { label: 'Gute Prognose', cls: 'b-green' };
  return { label: category || 'Beobachtung', cls: 'b-blue' };
}

export default function Knowledge() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchKnowledge();
        if (!cancelled) {
          setLessons(Array.isArray(data) ? data : []);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Fehler');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
  }, []);

  const counts = lessons.reduce((acc, l) => {
    const meta = typeMeta(l.category);
    acc[meta.label] = (acc[meta.label] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page-scroll">
      {err && (
        <div className="card" style={{ borderColor: 'var(--red)', marginBottom: '12px' }}>
          <div style={{ color: 'var(--red)', fontSize: '12px' }}>Fehler: {err}</div>
        </div>
      )}
      <div className="row-4">
        <div className="mcard">
          <div className="mlabel">Lektionen</div>
          <div className="mval">{loading ? '…' : lessons.length}</div>
          <div className="msub c-muted">Gesamt</div>
        </div>
        <div className="mcard">
          <div className="mlabel">Schlechte Prognose</div>
          <div className="mval c-red">{counts['Schlechte Prognose'] || 0}</div>
          <div className="msub c-red">{lessons.length ? Math.round((counts['Schlechte Prognose'] || 0) / lessons.length * 100) + '%' : '—'}</div>
        </div>
        <div className="mcard">
          <div className="mlabel">Schlechtes Timing</div>
          <div className="mval c-yellow">{counts['Schlechtes Timing'] || 0}</div>
          <div className="msub c-muted">{lessons.length ? Math.round((counts['Schlechtes Timing'] || 0) / lessons.length * 100) + '%' : '—'}</div>
        </div>
        <div className="mcard">
          <div className="mlabel">Externer Schock</div>
          <div className="mval">{counts['Externer Schock'] || 0}</div>
          <div className="msub c-muted">{lessons.length ? Math.round((counts['Externer Schock'] || 0) / lessons.length * 100) + '%' : '—'}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <div className="card-title">Bot-Lernprotokoll</div>
          <div className="badge b-blue">{lessons.length} Einträge</div>
        </div>
        {loading && <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '12px' }}>Lade…</div>}
        {!loading && lessons.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '12px' }}>
            Noch keine Lektionen gespeichert. Der Bot lernt mit jedem Trade dazu.
          </div>
        )}
        {lessons.map((l, i) => {
          const meta = typeMeta(l.category);
          return (
            <div className="learn-item" key={l.id || i}>
              <div className={`badge ${meta.cls}`} style={{ marginBottom: '10px', display: 'inline-block' }}>{meta.label}</div>
              <div style={{ fontSize: '13px', lineHeight: 1.7 }}>{l.lesson || l.content || l.text || '—'}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'var(--muted)', marginTop: '10px' }}>
                {l.created_at ? new Date(l.created_at).toLocaleString('de-DE') : ''}
                {l.market_id ? ' · ' + l.market_id : ''}
                {l.pnl != null ? ` · ${l.pnl >= 0 ? '+' : ''}${l.pnl} EUR` : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
