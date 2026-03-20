import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { inversionesAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const QUICK_SYMBOLS = [
  { label: 'BTC',  symbol: 'BTC/USD',  icon: '₿', assetClass: 'crypto', color: '#f7931a' },
  { label: 'ETH',  symbol: 'ETH/USD',  icon: 'Ξ', assetClass: 'crypto', color: '#627eea' },
  { label: 'SOL',  symbol: 'SOL/USD',  icon: '◎', assetClass: 'crypto', color: '#9945ff' },
  { label: 'DOGE', symbol: 'DOGE/USD', icon: 'Ð', assetClass: 'crypto', color: '#c2a633' },
  { label: 'SPY',  symbol: 'SPY',      icon: '📊', assetClass: 'stock',  color: '#10b981' },
  { label: 'AAPL', symbol: 'AAPL',     icon: '🍎', assetClass: 'stock',  color: '#6b7280' },
  { label: 'MSFT', symbol: 'MSFT',     icon: 'Ⓜ', assetClass: 'stock',  color: '#0ea5e9' },
  { label: 'NVDA', symbol: 'NVDA',     icon: '⚡', assetClass: 'stock',  color: '#76b900' },
];

const fmtPrice = (n) => {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1000) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 1)    return `$${n.toFixed(2)}`;
  return `$${n.toFixed(n < 0.01 ? 6 : 4)}`;
};

export default function TradingPanel() {
  const { usuario } = useContext(AuthContext);
  const navigate = useNavigate();

  const [selected, setSelected]       = useState(QUICK_SYMBOLS[0]);
  const [customSymbol, setCustomSymbol] = useState('');
  const [quote, setQuote]             = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [cantidad, setCantidad]       = useState('');
  const [modoUsd, setModoUsd]         = useState(true);
  const [buying, setBuying]           = useState(false);
  const [mensaje, setMensaje]         = useState(null);
  const [posiciones, setPosiciones]   = useState([]);
  const [loadingPos, setLoadingPos]   = useState(false);

  const activeSymbol = customSymbol.trim().toUpperCase() || selected.symbol;
  const activeClass  = customSymbol.trim()
    ? (customSymbol.includes('/') ? 'crypto' : 'stock')
    : selected.assetClass;

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

  const handleSymbolSelect = (sym) => {
    setSelected(sym);
    setCustomSymbol('');
    setMensaje(null);
    setCantidad('');
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const s = customSymbol.trim().toUpperCase();
    if (!s) return;
    setMensaje(null);
    setCantidad('');
    fetchQuote(s);
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

      {/* ── Quick symbol pills ─────────────────────────────────────────── */}
      <div style={S.pillsWrap}>
        {QUICK_SYMBOLS.map((sym) => {
          const isActive = !customSymbol && selected.symbol === sym.symbol;
          return (
            <button
              key={sym.symbol}
              type="button"
              style={{
                ...S.pill,
                background:  isActive ? sym.color : 'rgba(255,255,255,0.06)',
                borderColor: isActive ? sym.color : 'rgba(255,255,255,0.12)',
                color:       isActive ? '#fff'    : '#cbd5e1',
              }}
              onClick={() => handleSymbolSelect(sym)}
            >
              <span style={{ fontSize: '1rem' }}>{sym.icon}</span>
              <span>{sym.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Custom symbol search ───────────────────────────────────────── */}
      <form style={S.searchWrap} onSubmit={handleCustomSubmit}>
        <input
          style={S.searchInput}
          value={customSymbol}
          onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
          placeholder="Buscar símbolo: TSLA, BNB/USD, AMZN…"
          maxLength={12}
          autoComplete="off"
          autoCapitalize="characters"
        />
        <button type="submit" style={S.searchBtn}>Buscar</button>
      </form>

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
  pillsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '18px 20px 0',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    border: '1px solid',
    borderRadius: 20,
    padding: '6px 14px',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s',
    background: 'none',
  },
  searchWrap: {
    display: 'flex',
    gap: 8,
    padding: '14px 20px 0',
  },
  searchInput: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    color: '#f1f5f9',
    padding: '10px 14px',
    fontSize: '0.9rem',
    outline: 'none',
  },
  searchBtn: {
    background: '#1d4ed8',
    border: 'none',
    borderRadius: 10,
    color: '#fff',
    cursor: 'pointer',
    padding: '10px 18px',
    fontWeight: 700,
    fontSize: '0.85rem',
    flexShrink: 0,
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
