import { useEffect, useState } from 'react';
import { PerfChart } from '../components/Charts';
import { dashboard } from '../api/client';

function fmtNum(n, digits = 2) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toFixed(digits);
}
function fmtPct(n, digits = 1) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toFixed(digits) + '%';
}

export default function Performance() {
  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await dashboard.getMetrics();
        if (!cancelled) { setM(data); setErr(null); }
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Fehler');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const winRate = m?.winRate;
  const sharpe = m?.sharpeRatio;
  const profitFactor = m?.profitFactor;
  const brier = m?.brierScore;
  const totalPnl = m?.totalPnl || 0;

  const brierRows = [
    { name: 'Gesamt', val: brier },
    { name: 'Grok', val: brier },
    { name: 'Claude', val: brier },
    { name: 'GPT-4o', val: brier },
    { name: 'Gemini', val: brier },
    { name: 'DeepSeek', val: brier },
  ].map(b => {
    const v = b.val != null ? Number(b.val) : null;
    const pct = v != null ? Math.max(0, Math.min(100, (1 - v) * 100)) : 0;
    const c = v == null ? 'var(--muted)' : v < 0.2 ? 'var(--green)' : v < 0.25 ? 'var(--blue)' : 'var(--yellow)';
    return { ...b, pct, c, display: v != null ? v.toFixed(3) : '—' };
  });

  return (
    <div className="page-scroll">
      {err && (
        <div className="card" style={{ borderColor: 'var(--red)', marginBottom: '12px' }}>
          <div style={{ color: 'var(--red)', fontSize: '12px' }}>Fehler: {err}</div>
        </div>
      )}
      <div className="row-4">
        <div className="mcard">
          <div className="mlabel">Win-Rate</div>
          <div className="mval c-green">{loading ? '…' : fmtPct(winRate)}</div>
          <div className="msub c-green">Ziel: 60%+</div>
        </div>
        <div className="mcard">
          <div className="mlabel">Sharpe Ratio</div>
          <div className="mval c-blue">{loading ? '…' : fmtNum(sharpe)}</div>
          <div className="msub c-green">{sharpe >= 2 ? 'Ausgezeichnet' : sharpe >= 1 ? 'Gut' : '—'}</div>
        </div>
        <div className="mcard">
          <div className="mlabel">Trades gesamt</div>
          <div className="mval c-yellow">{loading ? '…' : (m?.totalTrades ?? '—')}</div>
          <div className="msub c-muted">alle Zeiten</div>
        </div>
        <div className="mcard">
          <div className="mlabel">Profit Factor</div>
          <div className="mval c-green">{loading ? '…' : fmtNum(profitFactor)}</div>
          <div className="msub c-green">Ziel: 1.5+</div>
        </div>
      </div>
      <div className="row-2">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Kumulativer Gewinn</div>
            <div className={`badge ${totalPnl >= 0 ? 'b-green' : 'b-red'}`}>
              {(totalPnl >= 0 ? '+' : '') + Math.round(totalPnl) + ' EUR'}
            </div>
          </div>
          <PerfChart />
        </div>
        <div className="card">
          <div className="card-head">
            <div className="card-title">Kalibrierung (Brier Score)</div>
            <div className="badge b-blue">{brier != null ? Number(brier).toFixed(3) : '—'}</div>
          </div>
          <div className="stat-grid">
            {brierRows.map(b => (
              <div className="stat-item" key={b.name}>
                <div className="stat-name">{b.name}</div>
                <div className="stat-val" style={{ color: b.c }}>{b.display}</div>
                <div className="brier-wrap"><div className="brier-fill" style={{ width: b.pct + '%', background: b.c }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
