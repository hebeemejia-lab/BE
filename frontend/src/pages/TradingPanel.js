import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { inversionesAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const CATALOG = {
  crypto: [
    { label: 'Bitcoin',   symbol: 'BTC/USD',  icon: '₿',  assetClass: 'crypto', color: '#f7931a', desc: 'BTC' },
    { label: 'Ethereum',  symbol: 'ETH/USD',  icon: 'Ξ',  assetClass: 'crypto', color: '#627eea', desc: 'ETH' },
    { label: 'Solana',    symbol: 'SOL/USD',  icon: '◎',  assetClass: 'crypto', color: '#9945ff', desc: 'SOL' },
    { label: 'Dogecoin',  symbol: 'DOGE/USD', icon: 'Ð',  assetClass: 'crypto', color: '#c2a633', desc: 'DOGE' },
    { label: 'XRP',       symbol: 'XRP/USD',  icon: '✕',  assetClass: 'crypto', color: '#346aa9', desc: 'XRP' },
    { label: 'Litecoin',  symbol: 'LTC/USD',  icon: 'Ł',  assetClass: 'crypto', color: '#a0a0a0', desc: 'LTC' },
    { label: 'Chainlink', symbol: 'LINK/USD', icon: '⬡',  assetClass: 'crypto', color: '#2a5ada', desc: 'LINK' },
    { label: 'Avalanche', symbol: 'AVAX/USD', icon: '▲',  assetClass: 'crypto', color: '#e84142', desc: 'AVAX' },
  ],
  stocks: [
    { label: 'Apple',     symbol: 'AAPL',  icon: '🍎', assetClass: 'stock', color: '#6b7280', desc: 'NASDAQ' },
    { label: 'Microsoft', symbol: 'MSFT',  icon: 'Ⓜ',  assetClass: 'stock', color: '#0ea5e9', desc: 'NASDAQ' },
    { label: 'NVIDIA',    symbol: 'NVDA',  icon: '⚡', assetClass: 'stock', color: '#76b900', desc: 'NASDAQ' },
    { label: 'Tesla',     symbol: 'TSLA',  icon: '🚗', assetClass: 'stock', color: '#e82127', desc: 'NASDAQ' },
    { label: 'Amazon',    symbol: 'AMZN',  icon: '📦', assetClass: 'stock', color: '#ff9900', desc: 'NASDAQ' },
    { label: 'Google',    symbol: 'GOOGL', icon: 'G',  assetClass: 'stock', color: '#4285f4', desc: 'NASDAQ' },
    { label: 'Meta',      symbol: 'META',  icon: '∞',  assetClass: 'stock', color: '#0866ff', desc: 'NASDAQ' },
    { label: 'S&P 500',   symbol: 'SPY',   icon: '📊', assetClass: 'stock', color: '#10b981', desc: 'ETF' },
  ],
};

const ALL_ASSETS = [...CATALOG.crypto, ...CATALOG.stocks];

const fmtPrice = (n) => {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1000) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 1)    return `$${n.toFixed(2)}`;
  return `$${n.toFixed(n < 0.01 ? 6 : 4)}`;
};

export default function TradingPanel() {
  const { usuario } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tab, setTab]               = useState('crypto'); // 'crypto' | 'stocks'
  const [selected, setSelected]     = useState(ALL_ASSETS[0]);
  const [quote, setQuote]           = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [cantidad, setCantidad]     = useState('');
  const [modoUsd, setModoUsd]       = useState(true);
  const [buying, setBuying]         = useState(false);
  const [mensaje, setMensaje]       = useState(null);
  const [posiciones, setPosiciones] = useState([]);
  const [loadingPos, setLoadingPos] = useState(false);

  const activeSymbol = selected.symbol;
  const activeClass  = selected.assetClass;

  const fetchQuote = useCallback(async (sym) => {
    setLoadingQuote(true);
    setQuote(null);
    try {
      const res = await inversionesAPI.obtenerCotizacion(sym);
      const d = res.data;
      setQuote({
        price:  parseFloat(d.precio || d.price || d.precioCompra || d.last || 0),
        change: d.cambio24h ?? d.cambio ?? null,
        symbol: d.symbol || sym,
      });
    } catch (e) {
      setQuote({ error: e.response?.data?.mensaje || 'No se pudo obtener cotización' });
    } finally {
      setLoadingQuote(false);
    }
  }, []);

  const fetchPosiciones = useCallback(async () => {
    setLoadingPos(true);
    try {
      const res  = await inversionesAPI.obtenerPosiciones();
      const data = res.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.posiciones) ? data.posiciones : [];
      setPosiciones(list);
    } catch (_) {
      setPosiciones([]);
    } finally {
      setLoadingPos(false);
    }
  }, []);

  useEffect(() => { fetchQuote(activeSymbol); }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchPosiciones(); }, [fetchPosiciones]);

  const handleAssetSelect = (asset) => {
    setSelected(asset);
    setTab(asset.assetClass === 'crypto' ? 'crypto' : 'stocks');
    setMensaje(null);
    setCantidad('');
  };

  const unidades = (() => {
    if (!cantidad || !quote?.price) return null;
    const n = parseFloat(cantidad);
    if (!Number.isFinite(n) || n <= 0) return null;
    return modoUsd ? n / quote.price : n;
  })();

  const costoEstimado = unidades && quote?.price ? unidades * quote.price : null;

  const handleComprar = async () => {
    if (!unidades || unidades <= 0) return;
    const confirmado = window.confirm(
      `¿Confirmas compra de ${unidades.toFixed(6)} ${activeSymbol} ≈ ${fmtPrice(costoEstimado)}?\n\nEsta es una orden REAL ejecutada vía Alpaca.`
    );
    if (!confirmado) return;

    setBuying(true);
    setMensaje(null);
    try {
      const res = await inversionesAPI.comprar({
        symbol:     activeSymbol,
        cantidad:   unidades,
        assetClass: activeClass,
      });
      setMensaje({ ok: true, text: res.data?.mensaje || '✅ Orden ejecutada correctamente' });
      setCantidad('');
      fetchPosiciones();
      fetchQuote(activeSymbol);
    } catch (e) {
      const err = e.response?.data?.mensaje || e.response?.data?.error || '❌ Error al ejecutar la orden';
      setMensaje({ ok: false, text: err });
    } finally {
      setBuying(false);
    }
  };

  const saldo = parseFloat(usuario?.saldo || 0);

  return (
    <div style={S.page}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => navigate('/dashboard')}>← Volver</button>
        <div style={{ flex: 1 }}>
          <h1 style={S.title}>Trading</h1>
          <p style={S.subtitle}>Órdenes de mercado en tiempo real · Alpaca Live</p>
        </div>
        <div style={S.balancePill}>
          <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>Saldo BE</span>
          <span style={{ fontWeight: 700 }}>${saldo.toFixed(2)}</span>
        </div>
      </div>

      {/* ── Category tabs ──────────────────────────────────────────────── */}
      <div style={S.tabWrap}>
        <button
          type="button"
          style={{ ...S.tabBtn, ...(tab === 'crypto' ? S.tabActive : {}) }}
          onClick={() => setTab('crypto')}
        >
          Crypto
        </button>
        <button
          type="button"
          style={{ ...S.tabBtn, ...(tab === 'stocks' ? S.tabActive : {}) }}
          onClick={() => setTab('stocks')}
        >
          Acciones
        </button>
      </div>

      {/* ── Asset catalog grid ────────────────────────────────────────────── */}
      <div style={S.catalogGrid}>
        {CATALOG[tab].map((asset) => {
          const isActive = selected.symbol === asset.symbol;
          return (
            <button
              key={asset.symbol}
              type="button"
              style={{
                ...S.assetCard,
                borderColor: isActive ? asset.color : 'rgba(255,255,255,0.1)',
                background:  isActive ? `${asset.color}28` : 'rgba(255,255,255,0.04)',
              }}
              onClick={() => handleAssetSelect(asset)}
            >
              <span style={{ fontSize: '1.6rem', color: asset.color }}>{asset.icon}</span>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f1f5f9' }}>{asset.label}</span>
              <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{asset.desc}</span>
            </button>
          );
        })}
      </div>

      {/* ── Quote card ─────────────────────────────────────────────────── */}
      <div style={S.quoteCard}>
        {loadingQuote ? (
          <p style={{ color: '#6b7280', textAlign: 'center', margin: 0 }}>Cargando cotización…</p>
        ) : quote?.error ? (
          <p style={{ color: '#fca5a5', textAlign: 'center', margin: 0 }}>{quote.error}</p>
        ) : quote ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={S.quoteSymbol}>{quote.symbol}</p>
              <p style={S.quotePrice}>{fmtPrice(quote.price)}</p>
            </div>
            {quote.change != null && (
              <span style={{
                ...S.changeBadge,
                background: quote.change >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color:      quote.change >= 0 ? '#34d399' : '#f87171',
              }}>
                {quote.change >= 0 ? '▲' : '▼'} {Math.abs(quote.change).toFixed(2)}%
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* ── Buy form ───────────────────────────────────────────────────── */}
      {quote && !quote.error && (
        <div style={S.buyCard}>
          {/* Mode toggle */}
          <div style={S.modeToggle}>
            <button
              type="button"
              style={{ ...S.modeBtn, ...(modoUsd ? S.modeBtnActive : {}) }}
              onClick={() => { setModoUsd(true); setCantidad(''); }}
            >
              Monto en USD
            </button>
            <button
              type="button"
              style={{ ...S.modeBtn, ...(!modoUsd ? S.modeBtnActive : {}) }}
              onClick={() => { setModoUsd(false); setCantidad(''); }}
            >
              Unidades
            </button>
          </div>

          <input
            style={S.qtyInput}
            type="number"
            min="0"
            step="any"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder={modoUsd ? 'Monto en USD (ej: 50)' : `Cantidad (ej: ${activeClass === 'crypto' ? '0.001' : '1'})`}
          />

          {costoEstimado != null && (
            <div style={S.estimado}>
              <span>≈ {unidades.toFixed(activeClass === 'crypto' ? 6 : 4)} {activeSymbol.split('/')[0]}</span>
              <span style={{ fontWeight: 700 }}>≈ {fmtPrice(costoEstimado)}</span>
            </div>
          )}

          {mensaje && (
            <div style={{
              ...S.mensajeBox,
              background:  mensaje.ok ? 'rgba(16,185,129,0.12)'  : 'rgba(239,68,68,0.12)',
              borderColor: mensaje.ok ? 'rgba(16,185,129,0.25)'  : 'rgba(239,68,68,0.25)',
              color:       mensaje.ok ? '#34d399' : '#fca5a5',
            }}>
              {mensaje.text}
            </div>
          )}

          <button
            type="button"
            style={{
              ...S.buyBtn,
              opacity: (!unidades || buying) ? 0.45 : 1,
              cursor:  (!unidades || buying) ? 'not-allowed' : 'pointer',
            }}
            onClick={handleComprar}
            disabled={!unidades || buying}
          >
            {buying ? 'Ejecutando orden…' : `Comprar ${activeSymbol.split('/')[0]}`}
          </button>

          <p style={S.disclaimer}>
            ⚠️ Orden de mercado real · Alpaca Live · Irreversible
          </p>
        </div>
      )}

      {/* ── Open positions ─────────────────────────────────────────────── */}
      <div style={S.posSection}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={S.posTitle}>Posiciones abiertas</h2>
          <button type="button" style={S.refreshBtn} onClick={fetchPosiciones} aria-label="Refrescar posiciones">↻</button>
        </div>

        {loadingPos ? (
          <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Cargando posiciones…</p>
        ) : posiciones.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>No tienes posiciones abiertas en Alpaca.</p>
        ) : (
          posiciones.map((pos, i) => {
            const qty     = parseFloat(pos.qty || pos.quantity || 0);
            const pnl     = parseFloat(pos.unrealized_pl || pos.ganancia_no_realizada || 0);
            const val     = parseFloat(pos.market_value || pos.valor_mercado || 0);
            const pnlPct  = parseFloat(pos.unrealized_plpc || pos.pnl_pct || 0) * 100;
            return (
              <div key={pos.symbol || i} style={S.posRow}>
                <div>
                  <span style={S.posSymbol}>{pos.symbol}</span>
                  <span style={S.posQty}>{qty.toFixed(6)} unidades</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={S.posVal}>{fmtPrice(val)}</span>
                  <span style={{ ...S.posPnl, color: pnl >= 0 ? '#34d399' : '#f87171' }}>
                    {pnl >= 0 ? '+' : ''}{fmtPrice(pnl)} ({pnlPct.toFixed(2)}%)
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Inline styles ─────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #0a0d14 0%, #0d1520 100%)',
    color: '#e5e7eb',
    fontFamily: "'Inter','Segoe UI',sans-serif",
    paddingBottom: 80,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    padding: '20px 20px 0',
    flexWrap: 'wrap',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '8px 14px',
    fontSize: '0.9rem',
    fontWeight: 600,
    flexShrink: 0,
    marginTop: 6,
  },
  title: { margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' },
  subtitle: { margin: '2px 0 0', fontSize: '0.76rem', color: '#6b7280' },
  balancePill: {
    marginLeft: 'auto',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '8px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
    fontSize: '0.95rem',
  },
  tabWrap: {
    display: 'flex',
    gap: 8,
    padding: '18px 20px 0',
  },
  tabBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#94a3b8',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.88rem',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: '#1d4ed8',
    borderColor: '#1d4ed8',
    color: '#fff',
  },
  catalogGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 10,
    padding: '12px 20px 0',
  },
  assetCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '14px 8px',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    color: '#f1f5f9',
  },
  quoteCard: {
    margin: '14px 20px 0',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: '20px 22px',
    minHeight: 60,
  },
  quoteSymbol: {
    margin: 0,
    fontSize: '0.76rem',
    color: '#6b7280',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  quotePrice: { margin: '4px 0 0', fontSize: '2rem', fontWeight: 800, color: '#f1f5f9' },
  changeBadge: {
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: '0.88rem',
    fontWeight: 700,
  },
  buyCard: {
    margin: '12px 20px 0',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: '20px 22px',
  },
  modeToggle: { display: 'flex', gap: 6, marginBottom: 14 },
  modeBtn: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '8px',
    fontSize: '0.82rem',
    fontWeight: 600,
    transition: 'all 0.15s',
  },
  modeBtnActive: { background: '#1d4ed8', borderColor: '#1d4ed8', color: '#fff' },
  qtyInput: {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    color: '#f1f5f9',
    padding: '12px 14px',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  estimado: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.82rem',
    color: '#94a3b8',
    margin: '10px 0 4px',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
  },
  mensajeBox: {
    border: '1px solid',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: '0.88rem',
    fontWeight: 600,
    margin: '10px 0 0',
    lineHeight: 1.4,
  },
  buyBtn: {
    width: '100%',
    marginTop: 14,
    background: 'linear-gradient(135deg,#10b981,#059669)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    padding: '14px',
    fontSize: '1rem',
    fontWeight: 800,
    transition: 'opacity 0.2s',
    letterSpacing: '0.01em',
  },
  disclaimer: {
    margin: '10px 0 0',
    fontSize: '0.71rem',
    color: '#6b7280',
    textAlign: 'center',
  },
  posSection: {
    margin: '18px 20px 0',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: '18px 20px',
  },
  posTitle: {
    margin: 0,
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  refreshBtn: { background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.1rem' },
  posRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  posSymbol: { display: 'block', fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' },
  posQty:    { display: 'block', fontSize: '0.74rem', color: '#6b7280', marginTop: 2 },
  posVal:    { display: 'block', fontWeight: 700, fontSize: '0.95rem' },
  posPnl:    { display: 'block', fontSize: '0.76rem', marginTop: 2 },
};
