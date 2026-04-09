import { useEffect, useState, useCallback } from 'react';
import { scanner as scannerApi, bot as botApi, dashboard } from '../api/client';

function fmtNum(n, digits = 2) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Number(n));
}
function fmtVol(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const v = Number(n);
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v.toFixed(0);
}

function signalMeta(signal) {
  const s = (signal || '').toUpperCase();
  if (['BUY', 'BUY_YES', 'KAUF', 'LONG'].includes(s)) return { label: 'KAUF', cls: 'b-green' };
  if (['SELL', 'BUY_NO', 'VERK', 'SHORT'].includes(s)) return { label: 'VERK', cls: 'b-red' };
  if (['WATCH', 'HOLD'].includes(s)) return { label: s || 'HOLD', cls: 'b-yellow' };
  if (s === 'SKIP') return { label: 'SKIP', cls: 'b-red' };
  if (s) return { label: s, cls: 'b-blue' };
  return { label: '—', cls: 'b-blue' };
}

function platBadge(plat) {
  const p = (plat || '').toLowerCase();
  if (p === 'kraken') return 'b-yellow';
  if (p === 'hyperliquid') return 'b-blue';
  if (p === 'stocks' || p === 'aktien') return 'b-blue';
  return 'b-blue';
}

export default function Scanner() {
  const [filter, setFilter] = useState('all');
  const [markets, setMarkets] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [results, m] = await Promise.all([
        scannerApi.getResults(),
        dashboard.getMetrics().catch(() => null),
      ]);
      setMarkets(Array.isArray(results) ? results : []);
      setMetrics(m);
      setErr(null);
    } catch (e) {
      setErr(e.message || 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  const filtered = markets.filter(m => {
    if (filter === 'all') return true;
    const p = (m.platform || '').toLowerCase();
    if (filter === 'kraken') return p === 'kraken';
    if (filter === 'hyperliquid') return p === 'hyperliquid';
    if (filter === 'stocks') return p === 'stocks' || p === 'aktien';
    if (filter === 'edge5') return (m.edgeScore || 0) >= 5;
    return true;
  });

  const handleScan = async () => {
    setScanning(true);
    try {
      await botApi.scanNow();
      setTimeout(load, 4000);
      setTimeout(load, 12000);
    } catch (e) {
      setErr(e.message || 'Scan fehlgeschlagen');
    } finally {
      setTimeout(() => setScanning(false), 2500);
    }
  };

  const avgEdge = markets.length
    ? markets.reduce((s, m) => s + (Number(m.edgeScore) || 0), 0) / markets.length
    : 0;

  const opportunities = markets.filter(m => (m.edgeScore || 0) >= 4).length;

  return (
    <div className="page-scroll">
      {err && (
        <div className="card" style={{ borderColor: 'var(--red)', marginBottom: '12px' }}>
          <div style={{ color: 'var(--red)', fontSize: '12px' }}>Fehler: {err}</div>
        </div>
      )}

      <div className="row-4">
        <div className="mcard">
          <div className="mlabel">Gescannte Märkte</div>
          <div className="mval">{loading ? '…' : markets.length}</div>
          <div className="msub c-muted">
            {metrics?.lastScanTime ? new Date(metrics.lastScanTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '—'}
          </div>
        </div>
        <div className="mcard">
          <div className="mlabel">Chancen gefunden</div>
          <div className="mval c-green">{opportunities}</div>
          <div className="msub c-green">{opportunities > 0 ? 'Bereit' : 'Kein Signal'}</div>
        </div>
        <div className="mcard">
          <div className="mlabel">Ø Edge</div>
          <div className="mval c-blue">{fmtNum(avgEdge, 1)}%</div>
          <div className="msub c-muted">Min. 4%</div>
        </div>
        <div className="mcard">
          <div className="mlabel">Bot-Status</div>
          <div className="mval">{metrics?.scannerActive ? 'AN' : 'AUS'}</div>
          <div className="msub c-muted">{metrics?.scannerActive ? 'Läuft' : 'Inaktiv'}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Aktive Märkte</div>
          <div className="filter-row">
            {[
              ['all', 'Alle'],
              ['kraken', 'Kraken'],
              ['hyperliquid', 'Hyperliquid'],
              ['stocks', 'Aktien'],
              ['edge5', 'Edge > 5%'],
            ].map(([k, l]) => (
              <button key={k} className={`filter-btn ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>
                {l}
              </button>
            ))}
            <button className="action-btn" onClick={handleScan} disabled={scanning}>
              {scanning ? 'Scannt...' : 'Jetzt scannen'}
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Markt</th>
                <th>Plattform</th>
                <th>Preis</th>
                <th>24h</th>
                <th>RSI</th>
                <th>Edge</th>
                <th>Volumen</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>Lade Marktdaten…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                  Noch keine Märkte gescannt. Klicke „Jetzt scannen".
                </td></tr>
              )}
              {filtered.map((m, i) => {
                const sig = signalMeta(m.signal);
                const edge = Number(m.edgeScore || 0);
                const ePct = Math.max(0, Math.min(100, Math.abs(edge) * 10));
                const change = Number(m.change24h || 0);
                return (
                  <tr key={m.id || i}>
                    <td style={{ fontWeight: 500 }}>{m.title || m.id}</td>
                    <td><div className={`badge ${platBadge(m.platform)}`}>{m.platform || '—'}</div></td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {fmtNum(m.price, m.price > 100 ? 2 : 4)} {m.currency || ''}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', color: change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {change >= 0 ? '+' : ''}{fmtNum(change, 2)}%
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted)' }}>
                      {m.rsi != null ? Math.round(m.rsi) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="edge-wrap"><div className="edge-fill" style={{ width: ePct + '%' }} /></div>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--blue)' }}>
                          {(edge >= 0 ? '+' : '') + fmtNum(edge, 1)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted)' }}>{fmtVol(m.volume)}</td>
                    <td><div className={`badge ${sig.cls}`}>{sig.label}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
