import { useEffect, useState } from 'react';
import { trades as tradesApi } from '../api/client';

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) +
         ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}
function fmtNum(n, digits = 0) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(Number(n));
}
function normalizeSide(side) {
  const s = (side || '').toLowerCase();
  if (['buy', 'kauf', 'long', 'yes', 'buy_yes'].includes(s)) return 'KAUF';
  if (['sell', 'verk', 'short', 'no', 'buy_no'].includes(s)) return 'VERK';
  return (side || '—').toUpperCase();
}
function platBadge(plat) {
  const p = (plat || '').toLowerCase();
  if (p === 'binance') return 'b-blue';
  if (p === 'kraken') return 'b-yellow';
  if (p === 'hyperliquid') return 'b-blue';
  return 'b-blue';
}

export function History() {
  const [filter, setFilter] = useState('all');
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await tradesApi.getAll({ limit: 200 });
        if (cancelled) return;
        setTrades(Array.isArray(data) ? data : []);
        setErr(null);
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Fehler beim Laden');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const enriched = trades.map(t => ({
    ...t,
    _side: normalizeSide(t.side),
    _won: Number(t.pnl || 0) >= 0,
    _pnl: Number(t.pnl || 0),
  }));

  const filtered = enriched.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'won') return t._won && t.status === 'closed';
    if (filter === 'lost') return !t._won && t.status === 'closed';
    if (filter === 'open') return t.status === 'open';
    return (t.platform || '').toLowerCase() === filter;
  });

  const closed = enriched.filter(t => t.status === 'closed');
  const won = closed.filter(t => t._won);
  const lost = closed.filter(t => !t._won);
  const totalPnl = closed.reduce((s, t) => s + t._pnl, 0);
  const winRate = closed.length > 0 ? (won.length / closed.length * 100) : 0;

  return (
    <div className="page-scroll">
      {err && (
        <div className="card" style={{ borderColor: 'var(--red)', marginBottom: '12px' }}>
          <div style={{ color: 'var(--red)', fontSize: '12px' }}>Fehler: {err}</div>
        </div>
      )}
      <div className="row-4">
        <div className="mcard">
          <div className="mlabel">Trades gesamt</div>
          <div className="mval">{loading ? '…' : trades.length}</div>
          <div className="msub c-muted">Historie</div>
        </div>
        <div className="mcard">
          <div className="mlabel">Gewonnen</div>
          <div className="mval c-green">{won.length}</div>
          <div className="msub c-green">{winRate.toFixed(1)}%</div>
        </div>
        <div className="mcard">
          <div className="mlabel">Verloren</div>
          <div className="mval c-red">{lost.length}</div>
          <div className="msub c-red">{closed.length ? (100 - winRate).toFixed(1) + '%' : '—'}</div>
        </div>
        <div className="mcard">
          <div className="mlabel">Nettogewinn</div>
          <div className={`mval ${totalPnl >= 0 ? 'c-blue' : 'c-red'}`}>{fmtNum(totalPnl)}</div>
          <div className={`msub ${totalPnl >= 0 ? 'c-green' : 'c-red'}`}>EUR gesamt</div>
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <div className="card-title">Alle Trades</div>
          <div className="filter-row">
            {[
              ['all', 'Alle'],
              ['open', 'Offen'],
              ['won', 'Gewonnen'],
              ['lost', 'Verloren'],
              ['binance', 'Binance'],
              ['kraken', 'Kraken'],
              ['hyperliquid', 'Hyperliquid'],
            ].map(([k, l]) => (
              <button key={k} className={`filter-btn ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Datum</th><th>Markt</th><th>Plattform</th><th>Seite</th><th>Einsatz</th><th>Konsens</th><th>Status</th><th>P&L</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>Lade…</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>Noch keine Trades vorhanden.</td></tr>
              )}
              {filtered.map((t, i) => (
                <tr key={t.id || i}>
                  <td style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '10px', color: 'var(--muted)' }}>{fmtDate(t.created_at)}</td>
                  <td style={{ fontWeight: 500 }}>{t.market_title || t.symbol || t.market_id || '—'}</td>
                  <td><div className={`badge ${platBadge(t.platform)}`}>{t.platform || '—'}</div></td>
                  <td><div className={`side ${t._side === 'KAUF' ? 's-yes' : 's-no'}`}>{t._side}</div></td>
                  <td style={{ fontFamily: 'JetBrains Mono,monospace' }}>{fmtNum(t.amount)} {t.currency || 'EUR'}</td>
                  <td style={{ fontFamily: 'JetBrains Mono,monospace', color: 'var(--blue)' }}>
                    {t.ai_consensus != null ? Math.round(t.ai_consensus * 100) + '%' : '—'}
                  </td>
                  <td>
                    {t.status === 'open'
                      ? <div className="badge b-blue">Offen</div>
                      : <div className={`badge ${t._won ? 'b-green' : 'b-red'}`}>{t._won ? 'Gewonnen' : 'Verloren'}</div>}
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono,monospace', color: t._pnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                    {t._pnl >= 0 ? '+' : ''}{fmtNum(t._pnl)} EUR
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default History;
