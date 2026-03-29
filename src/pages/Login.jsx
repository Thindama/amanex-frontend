import { useState } from 'react';
import { auth } from '../api/client';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Bitte alle Felder ausfüllen'); return; }
    setLoading(true); setError('');
    try {
      const data = await auth.login(email, password);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    setEmail('aman@amanex.de');
    setPassword('Amanex2026!');
    setTimeout(handleLogin, 200);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* HEADER */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <a href="https://amanex.de" style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', letterSpacing: '4px', color: 'var(--blue)', fontWeight: 600 }}>AMANEX</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '2px' }}>Private Trading Intelligence</div>
        </a>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[['68%','Win-Rate'],['24/7','Aktiv']].map(([v,l]) => (
            <div key={l} style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', color: 'var(--text)', fontWeight: 600 }}>{v}</div>
              <div style={{ fontSize: '9px', color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', letterSpacing: '3px', color: 'rgba(184,151,90,0.6)', marginBottom: '32px' }}>
            SYS-AMANEX-v2.1 · SECURE ACCESS
          </div>

          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Willkommen zurück.</div>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '32px', lineHeight: 1.7 }}>
            Nur eingeladene Personen haben Zugang.
          </p>

          {error && (
            <div style={{ background: 'rgba(255,77,106,.08)', border: '1px solid rgba(255,77,106,.2)', borderRadius: '7px', padding: '10px 14px', fontSize: '12px', color: 'var(--red)', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>E-Mail</div>
            <input
              className="field-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="deine@email.de"
              style={{ fontSize: '16px' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Passwort</div>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              style={{ fontSize: '16px' }}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? 'var(--sub)' : 'var(--blue)',
              border: 'none', borderRadius: '8px',
              color: '#000', fontSize: '14px', fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>oder</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <button
            onClick={handleDemo}
            style={{
              width: '100%', padding: '13px',
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--muted)',
              fontSize: '13px', fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            }}>
            Demo-Zugang verwenden
          </button>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: 'var(--muted)' }}>
            Geschützte Verbindung · Invite-Only Platform
          </div>
        </div>
      </div>
    </div>
  );
}
