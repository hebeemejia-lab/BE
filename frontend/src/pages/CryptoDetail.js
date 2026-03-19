import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inversionesAPI } from '../services/api';

// ─── Coin catalogue ─────────────────────────────────────────────────────────
const COIN_MAP = {
  bitcoin:      { name: 'Bitcoin',  symbol: 'BTC',  icon: '₿', color: '#f7931a', gecko: 'bitcoin' },
  ethereum:     { name: 'Ethereum', symbol: 'ETH',  icon: 'Ξ', color: '#627eea', gecko: 'ethereum' },
  solana:       { name: 'Solana',   symbol: 'SOL',  icon: '◎', color: '#9945ff', gecko: 'solana' },
  binancecoin:  { name: 'BNB',      symbol: 'BNB',  icon: 'B', color: '#f0b90b', gecko: 'binancecoin' },
  dogecoin:     { name: 'Dogecoin', symbol: 'DOGE', icon: 'Ð', color: '#c2a633', gecko: 'dogecoin' },
  cardano:      { name: 'Cardano',  symbol: 'ADA',  icon: '₳', color: '#0033ad', gecko: 'cardano' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtUsd(n) {
  if (n == null) return '-';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)         return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${n.toFixed(n < 0.01 ? 6 : 4)}`;
}

function normaliseSparkline(prices = [], bars = 42) {
  if (!prices.length) return Array(bars).fill(50);
  const step = Math.max(1, Math.floor(prices.length / bars));
  const sampled = [];
  for (let i = 0; i < bars; i++) sampled.push(prices[Math.min(i * step, prices.length - 1)]);
  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const range = max - min || 1;
  return sampled.map(p => 10 + ((p - min) / range) * 80);
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #0a0d14 0%, #111827 100%)',
    color: '#e5e7eb',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    padding: '0 0 80px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 24px 0',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '8px 14px',
    fontSize: '0.9rem',
    fontWeight: 600,
    transition: 'background 0.2s',
  },
  breadcrumb: { fontSize: '0.8rem', color: '#6b7280', marginLeft: 'auto' },
  heroSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    padding: '28px 24px 16px',
  },
  coinIcon: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.7rem',
    fontWeight: 900,
    flexShrink: 0,
  },
  coinName: { fontSize: '1.55rem', fontWeight: 800, margin: 0 },
  coinSymbol: { fontSize: '0.85rem', color: '#9ca3af', marginTop: 2 },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    padding: '0 24px 8px',
    flexWrap: 'wrap',
  },
  price: { fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em' },
  change: (up) => ({
    fontSize: '1rem',
    fontWeight: 700,
    color: up ? '#22c55e' : '#ef4444',
    background: up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
    padding: '3px 10px',
    borderRadius: '20px',
  }),
  chartCard: {
    margin: '16px 24px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '20px',
  },
  chartLabel: { fontSize: '0.75rem', color: '#6b7280', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' },
  sparkWrap: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '2px',
    height: 80,
    overflow: 'hidden',
  },
  bar: (h, color) => ({
    flex: 1,
    height: `${h}%`,
    minHeight: 2,
    borderRadius: '3px 3px 0 0',
    background: color,
    opacity: 0.75,
  }),
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    margin: '0 24px 16px',
  },
  statCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    padding: '16px',
  },
  statLabel: { fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 },
  statVal: { fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' },
  holdingCard: {
    margin: '0 24px 16px',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.06))',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: '16px',
    padding: '20px',
  },
  holdingLabel: { fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 },
  holdingAmt: { fontSize: '1.6rem', fontWeight: 800, color: '#c4b5fd', marginBottom: 2 },
  holdingUsd: { fontSize: '0.9rem', color: '#94a3b8' },
  actionsSection: { margin: '0 24px' },
  actionsLabel: { fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 },
  actionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' },
  actionBtn: (color) => ({
    background: color || 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    color: '#f1f5f9',
    cursor: 'pointer',
    padding: '14px 8px',
    fontSize: '0.82rem',
    fontWeight: 700,
    textAlign: 'center',
    transition: 'transform 0.15s, filter 0.15s',
    letterSpacing: '0.01em',
  }),
  loader: {
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    color: '#6b7280',
    fontSize: '0.9rem',
  },
  errorCard: {
    margin: '40px 24px',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '14px',
    padding: '24px',
    textAlign: 'center',
    color: '#fca5a5',
  },
};

export default function CryptoDetail() {
  const { coinId } = useParams();
  const navigate = useNavigate();

  const coin = COIN_MAP[coinId?.toLowerCase()];

  const [marketData, setMarketData]     = useState(null);
  const [sparkline, setSparkline]       = useState([]);
  const [holding, setHolding]           = useState(null); // { qty, valueUsd }
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  const fetchData = useCallback(async () => {
    if (!coin) { setLoading(false); return; }
    setLoading(true);
    setError('');
    setHolding(null);
    let fallbackMarketPrice = 0;

    try {
      // ── Market data ──────────────────────────────────────────────────────
      const cgUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coin.gecko}&order=market_cap_desc&per_page=1&page=1&sparkline=true&price_change_percentage=24h`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const cgRes = await fetch(cgUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!cgRes.ok) throw new Error('No se pudo obtener datos del mercado');
      const cgData = await cgRes.json();
      const md = cgData[0];
      if (md) {
        fallbackMarketPrice = Number(md.current_price) || 0;
        setMarketData(md);
        setSparkline(normaliseSparkline(md.sparkline_in_7d?.price || []));
      }
    } catch (e) {
      if (e.name !== 'AbortError') setError('Error al cargar datos del mercado. Intenta de nuevo.');
    }

    try {
      // ── User positions ────────────────────────────────────────────────────
      const posRes = await inversionesAPI.obtenerPosiciones();
      const payload = posRes?.data;
      const posiciones = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.posiciones)
          ? payload.posiciones
          : [];

      const match = posiciones.find(
        (p) => p.symbol === coin.symbol || p.symbol === `${coin.symbol}/USD`
      );

      if (match) {
        const qty = parseFloat(match.qty || match.quantity || 0);
        const price = parseFloat(match.current_price || match.lastPrice || match.precio_actual || fallbackMarketPrice || 0);
        setHolding({ qty, valueUsd: qty * price });
      }
    } catch (_) {
      // Non-fatal — user may not have positions
    }

    setLoading(false);
  }, [coin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Invalid coin ──────────────────────────────────────────────────────────
  if (!coin) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <button style={S.backBtn} onClick={() => navigate('/dashboard')}>← Volver</button>
        </div>
        <div style={S.errorCard}>
          <p style={{ fontSize: '1.5rem', margin: '0 0 8px' }}>🤔</p>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>Criptomoneda no reconocida</p>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>"{coinId}" no está en la lista de activos disponibles.</p>
        </div>
      </div>
    );
  }

  const up24 = marketData ? marketData.price_change_percentage_24h >= 0 : true;
  const price24raw = marketData?.price_change_percentage_24h;
  const change24str = price24raw != null ? `${price24raw >= 0 ? '+' : ''}${price24raw.toFixed(2)}%` : '...';

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => navigate(-1)}>← Volver</button>
        <span style={S.breadcrumb}>Dashboard / {coin.name}</span>
      </div>

      {/* ── Hero ── */}
      <div style={S.heroSection}>
        <div style={{ ...S.coinIcon, background: `${coin.color}22`, color: coin.color }}>
          {coin.icon}
        </div>
        <div>
          <p style={S.coinName}>{coin.name}</p>
          <p style={S.coinSymbol}>{coin.symbol} · Precio en tiempo real</p>
        </div>
      </div>

      {/* ── Price row ── */}
      {loading ? (
        <div style={S.loader}>
          <div style={{ width: 36, height: 36, border: `3px solid ${coin.color}33`, borderTopColor: coin.color, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Cargando datos del mercado…
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <div style={S.errorCard}>{error} <button style={{ ...S.backBtn, marginTop: 16 }} onClick={fetchData}>Reintentar</button></div>
      ) : (
        <>
          <div style={S.priceRow}>
            <span style={S.price}>{marketData ? fmtUsd(marketData.current_price) : '-'}</span>
            <span style={S.change(up24)}>{change24str}</span>
          </div>

          {/* ── Sparkline ── */}
          <div style={S.chartCard}>
            <p style={S.chartLabel}>Últimos 7 días</p>
            <div style={S.sparkWrap} aria-hidden="true">
              {sparkline.map((h, i) => (
                <div key={i} style={S.bar(h, coin.color)} />
              ))}
            </div>
          </div>

          {/* ── Stats ── */}
          <div style={S.statsGrid}>
            <div style={S.statCard}>
              <p style={S.statLabel}>Volumen 24h</p>
              <p style={S.statVal}>{marketData ? fmtUsd(marketData.total_volume) : '-'}</p>
            </div>
            <div style={S.statCard}>
              <p style={S.statLabel}>Market Cap</p>
              <p style={S.statVal}>{marketData ? fmtUsd(marketData.market_cap) : '-'}</p>
            </div>
            <div style={S.statCard}>
              <p style={S.statLabel}>Máx. 24h</p>
              <p style={S.statVal}>{marketData ? fmtUsd(marketData.high_24h) : '-'}</p>
            </div>
            <div style={S.statCard}>
              <p style={S.statLabel}>Mín. 24h</p>
              <p style={S.statVal}>{marketData ? fmtUsd(marketData.low_24h) : '-'}</p>
            </div>
          </div>

          {/* ── Holding ── */}
          <div style={S.holdingCard}>
            <p style={S.holdingLabel}>Tu posición en {coin.symbol}</p>
            {holding ? (
              <>
                <p style={S.holdingAmt}>{holding.qty.toFixed(holding.qty < 0.01 ? 6 : 4)} {coin.symbol}</p>
                <p style={S.holdingUsd}>≈ {fmtUsd(holding.valueUsd)} USD</p>
              </>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                No tienes posiciones abiertas en {coin.name}.
              </p>
            )}
          </div>

          {/* ── Actions ── */}
          <div style={S.actionsSection}>
            <p style={S.actionsLabel}>Acciones</p>
            <div style={S.actionsGrid}>
              <button
                style={S.actionBtn(`${coin.color}22`)}
                onClick={() => navigate('/saldos', { state: { openFlow: 'deposit' } })}
              >
                📥 Depositar
              </button>
              <button
                style={S.actionBtn('rgba(34,197,94,0.12)')}
                onClick={() => navigate('/saldos', { state: { openFlow: 'buy' } })}
              >
                🛒 Comprar
              </button>
              <button
                style={S.actionBtn('rgba(251,146,60,0.12)')}
                onClick={() => navigate('/saldos', { state: { openFlow: 'withdraw-crypto', coin: coin.symbol } })}
              >
                📤 Retirar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
