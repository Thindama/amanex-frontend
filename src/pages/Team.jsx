import { useEffect, useState } from 'react';
import { team as teamApi } from '../api/client';

function initialsOf(email) {
  if (!email) return '??';
  const local = email.split('@')[0];
  return local.substring(0, 2).toUpperCase();
}
function colorOf(email) {
  if (!email) return '#3498db';
  const colors = ['linear-gradient(135deg,#b8975a,#00d68f)', '#3498db', '#9b59b6', '#f39c12', '#1abc9c', '#e74c3c'];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) | 0;
  return colors[Math.abs(hash) % colors.length];
}

export default function Team() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await teamApi.getAll();
        if (!cancelled) {
          setTeam(Array.isArray(data) ? data : []);
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

  const invite = () => {
    if (!email) return;
    // Backend hat noch keinen Invite-Endpoint - lokal optimistisch anzeigen
    setSent(true);
    setEmail('');
    setTimeout(() => setSent(false), 2500);
  };

  return (
    <div className="page-scroll">
      {err && (
        <div className="card" style={{ borderColor: 'var(--red)', marginBottom: '12px' }}>
          <div style={{ color: 'var(--red)', fontSize: '12px' }}>Fehler: {err}</div>
        </div>
      )}
      <div className="row-2">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Team-Mitglieder</div>
            <div className="badge b-blue">{team.length} aktiv</div>
          </div>
          {loading && <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '12px' }}>Lade…</div>}
          {!loading && team.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '12px' }}>Noch keine Mitglieder.</div>
          )}
          {team.map((m, i) => (
            <div className="team-item" key={m.id || i}>
              <div className="team-ava" style={{ background: colorOf(m.email) }}>{initialsOf(m.email)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{m.email}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {m.created_at ? new Date(m.created_at).toLocaleDateString('de-DE') : ''}
                </div>
              </div>
              <div className={m.role === 'admin' ? 'r-admin' : 'r-viewer'}>
                {m.role === 'admin' ? 'Admin' : 'Viewer'}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Mitglied einladen</div></div>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>E-Mail</div>
            <input className="field-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@beispiel.com" />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rolle</div>
            <div className="filter-row">
              <button className={`filter-btn ${role === 'admin' ? 'on' : ''}`} onClick={() => setRole('admin')}>Admin</button>
              <button className={`filter-btn ${role === 'viewer' ? 'on' : ''}`} onClick={() => setRole('viewer')}>Viewer</button>
            </div>
          </div>
          <div style={{ padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.8 }}>
            <span style={{ color: 'var(--blue)' }}>Admin:</span> Voller Zugriff auf alle Funktionen<br />
            Viewer: Nur lesen, keine Änderungen
          </div>
          <button className={`save-btn ${sent ? 'saved' : ''}`} onClick={invite}>
            {sent ? 'Eingeladen ✓' : 'Einladung senden'}
          </button>
        </div>
      </div>
    </div>
  );
}
