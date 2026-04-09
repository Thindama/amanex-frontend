import { useEffect, useState } from 'react';
import { PnlChart } from '../components/Charts';
import { dashboard, trades as tradesApi } from '../api/client';

const AI_MODELS = [
  { name: 'Grok (30%)', weight: 30 },
  { name: 'Claude (20%)', weight: 20 },
  { name: 'GPT-4o (20%)', weight: 20 },
  { name: 'Gemini (15%)', weight: 15 },
  { name: 'DeepSeek (15%)', weight: 15 },
];

function fmtEur(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(n) + ' EUR';
}
function fmtPct(n, digits = 1) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toFixed(digits) + '%';
}
function fmtNum(n, digits = 2) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toFixed(digits);
}
function relTime(iso) {
  if (!iso) return '—';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'vor ' + Math.round(diff) + ' Sek.';
  if (diff < 3600) return 'vor ' + Math.round(diff / 60) + ' Min.';
  if (diff < 86400) return 'vor ' + Math.round(diff / 3600) + ' Std.';
  return 'vor ' + Math.round(diff / 86400) + ' T.';
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [m, t] = await Promise.all([
          dashboard.getMetrics(),
          tradesApi.getAll({ limit: 6 }).catch(() => []),
        ]);
        if (cancelled) return;
        setMetrics(m);
        setRecentTrades(Array.isArray(t) ? t : []);
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

  const m = metrics || {};
  const balance = m.balance;
  const dailyPnl = m.dailyPnl || 0;
  const winRate = m.winRate;
  const sharpe = m.sharpeRatio;
  const open = m.openPositions;
  const maxOpen = m.maxPositions;
  const topMarkets = m.topMarkets || [];
  const bestEdge = topMarkets.length ? topMarkets[0] : null;
  const edgeBadge = bestEdge?.edgeScore != null
    ? (bestEdge.edgeScore >= 0 ? '+' : '') + Number(bestEdge.edgeScore).toFixed(1) + '%'
    : '—';

  const risks = [
    { n: 'Tages-P&L', v: (dailyPnl >= 0 ? '+' : '') + fmtEur(dailyPnl), c: dailyPnl >= 0 ? 'var(--green)' : 'var(--red)', w: Math.min(100, Math.abs(dailyPnl) / 100) },
    { n: 'Exposure', v: `${open ?? 0} / ${maxOpen ?? 0}`, c: 'var(--blue)', w: maxOpen ? (open / maxOpen) * 100 : 0 },
    { n: 'Profit Factor', v: fmtNum(m.profitFactor), c: 'var(--green)', w: Math.min(100, (m.profitFactor || 0) * 40) },
    { n: 'Brier Score', v: fmtNum(m.brierScore, 3), c: 'var(--yellow)', w: Math.min(100, (1 - (m.brierScore || 0.25)) * 100) },
  ];

  const consensusPct = bestEdge?.edgeScore != null ? Math.round(50 + bestEdge.edgeScore * 5) : null;

  return (
    <div className="page-scroll">
      {err && (
        <div className="card" style={{ borderColor: 'var(--red)', marginBottom: '12px' }}>
          <div style={{ color: 'var(--red)', fontSize: '12px' }}>Backend nicht erreichbar: {err}</div>
        </div>
      )}

      <div className="row-4">
        <div className="mcard">
          <div className="mlabel">Kontostand</div>
          <div className="mval c-green">{loading ? '…' : fmtEur(balance)}</div>
          <div className={`msub ${dailyPnl >= 0 ? 'c-green' : 'c-red'}`}>
            {dailyPnl >= 0 ? '+' : ''}{fmtEur(dailyPnl)} heute
          </div>
        </div>
        <div className="mcard">
          <div className="mlabel">Win-Rate</div>
          <div className="mval c-blue">{loading ? '…' : fmtPct(winRate)}</div>
          <div className="msub c-muted">Ziel: 60%+</div>
        </div>
        <div className="mcard">
          <div className="mlabel">Offene Positionen</div>
          <div className="mval c-yellow">{loading ? '…' : `${open ?? 0} / ${maxOpen ?? 0}`}</div>
          <div className="msub c-muted">Max. {maxOpen ?? '—'}</div>
        </div>
        <div className="mcard">
          <div className="mlabel">Sharpe Ratio</div>
          <div className="mval c-green">{loading ? '…' : fmtNum(sharpe)}</div>
          <div className="msub c-green">{sharpe >= 2 ? 'Ausgezeichnet' : sharpe >= 1 ? 'Gut' : '—'}</div>
        </div>
      </div>

      <div className="row-2">
        <div className="card">
          <div className="card-head">
            <div className="card-title">P&L letzte 14 Tage</div>
            <div className={`badge ${dailyPnl >= 0 ? 'b-green' : 'b-red'}`}>
              {dailyPnl >= 0 ? '+' : ''}{fmtEur(dailyPnl)}
            </div>
          </div>
          <PnlChart />
        </div>
        <div className="card">
          <div className="card-head">
            <div className="card-title">Risiko-Monitor</div>
            <div className="badge b-green">
              {m.scannerActive ? `Scanner aktiv · ${m.trackedMarkets} Märkte` : 'Warten auf Scan'}
            </div>
          </div>
          <div className="risk-grid">
            {risks.map(r => (
              <div className="risk-item" key={r.n}>
                <div className="risk-name">{r.n}</div>
                <div className="risk-val" style={{ color: r.c }}>{r.v}</div>
                <div className="risk-track">
                  <div className="risk-fill" style={{ width: Math.max(0, Math.min(100, r.w)) + '%', background: r.c }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row-2">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Letzte Trades</div>
            <div className="badge b-blue">{recentTrades.length} aktiv</div>
          </div>
          <div className="trade-list">
            {recentTrades.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--muted)', padding: '16px 4px' }}>
                {loading ? 'Lade…' : 'Noch keine Trades – der Bot hat noch nichts ausgeführt.'}
              </div>
            )}
            {recentTrades.map((tr, i) => {
              const pnl = Number(tr.pnl || 0);
              const pos = pnl >= 0;
              const side = (tr.side || '').toLowerCase() === 'sell' || (tr.side || '').toLowerCase() === 'verk' ? 'VERK' : 'KAUF';
              return (
                <div className="trade" key={tr.id || i}>
                  <div className={`side ${side === 'KAUF' ? 's-yes' : 's-no'}`}>{side}</div>
                  <div style={{ flex: 1 }}>
                    <div className="t-name">{tr.market_title || tr.symbol || tr.market_id || '—'}</div>
                    <div className="t-plat">{(tr.platform || '—') + ' · ' + relTime(tr.created_at)}</div>
                  </div>
                  <div className={`t-pnl ${pos ? 'c-green' : 'c-red'}`}>
                    {(pos ? '+' : '') + fmtEur(pnl)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">KI-Konsens</div>
            <div className={`badge ${bestEdge ? 'b-green' : 'b-blue'}`}>
              {bestEdge ? `Edge ${edgeBadge}` : 'Warte auf Signal'}
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
            {bestEdge
              ? `${bestEdge.title || bestEdge.id} · ${bestEdge.signal || 'HOLD'} @ ${fmtNum(bestEdge.price)}`
              : 'Kein aktuelles Top-Signal'}
          </div>
          <div className="ai-list">
            {AI_MODELS.map(model => (
              <div className="ai-row" key={model.name}>
                <div className="ai-name">{model.name}</div>
                <div className="ai-track">
                  <div className="ai-fill" style={{
                    width: (bestEdge ? Math.min(100, 50 + (bestEdge.edgeScore || 0) * 3) : 0) + '%',
                    background: 'var(--blue)',
                  }} />
                </div>
                <div className="ai-pct c-blue">
                  {bestEdge ? Math.round(50 + (bestEdge.edgeScore || 0) * 3) + '%' : '—'}
                </div>
              </div>
            ))}
          </div>
          <div className="consensus">
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Gewichteter Konsens</span>
            <span style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: 'var(--blue)' }}>
              {consensusPct != null ? consensusPct + '%' : '—'}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '8px', fontFamily: 'JetBrains Mono, monospace' }}>
            Letzter Scan: {relTime(m.lastScanTime)}
          </div>
        </div>
      </div>
    </div>
  );
}
