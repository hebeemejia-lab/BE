/**
 * TradingDashboard.jsx
 * Mobile-first React + Tailwind dashboard
 * Blocks: ACCIONES RÁPIDAS (7 módulos) + TRANSFERENCIAS
 * Live prices via useMarketData (simulated WebSocket)
 * Balance via useBalance (simulated REST)
 */
import React, { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../tailwind.css';
import ActionBlock from '../components/ActionBlock';
import { useMarketData, useBalance } from '../hooks/useMarketData';
import { AuthContext } from '../context/AuthContext';

const DASHBOARD_OPTIONS = [
  { id: 'casa', label: 'Casa', icon: '🏠' },
  { id: 'datos', label: 'Datos', icon: '📊' },
  { id: 'trading', label: 'Trading', icon: '📈' },
  { id: 'transferencias', label: 'Transferencias', icon: '💸' },
  { id: 'servicios', label: 'Servicios', icon: '🧩' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtUsd(n, decimals = 2) {
  if (n == null) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

function fmtChange(c) {
  const sign = c >= 0 ? '+' : '';
  return `${sign}${c.toFixed(2)}%`;
}

// ── Ticker strip (live) ───────────────────────────────────────────────────────
function TickerBar({ prices }) {
  const items = Object.entries(prices);
  return (
    <div className="bg-[#0a0d14] border-b border-white/10 py-2">
      <div className="flex gap-2 px-3 sm:px-4 overflow-x-auto whitespace-nowrap">
        {items.map(([sym, d]) => (
          <span
            key={sym}
            className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-mono rounded-full border border-white/10 bg-white/5 px-2.5 py-1"
          >
            <span className="font-bold text-white">{sym}</span>
            <span className="text-slate-300">{fmtUsd(d.price, d.price >= 1 ? 2 : 6)}</span>
            <span className={d.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {fmtChange(d.change24h)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Balance card ─────────────────────────────────────────────────────────────
function BalanceCard({ balance, loading }) {
  const miniStats = [
    { label: 'Staked', val: fmtUsd(balance?.staked) },
    { label: 'Colateral', val: fmtUsd(balance?.collateral) },
    { label: 'NFTs', val: balance?.nfts },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-900/40 to-[#111827] p-4 sm:p-5 shadow-lg">
      <p className="text-[11px] font-bold tracking-widest uppercase text-slate-300 mb-3">Saldo Chain / Portfolio</p>
      {loading ? (
        <div className="h-10 w-40 bg-white/10 animate-pulse rounded-lg" />
      ) : (
        <>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight break-all sm:break-normal">
            {fmtUsd(balance?.usd)}
          </p>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {miniStats.map(({ label, val }, index) => (
              <div
                key={label}
                className={`bg-white/5 rounded-xl p-2 sm:p-2.5 text-center ${index === 2 ? 'col-span-2 sm:col-span-1' : ''}`}
              >
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{val}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Mini price table (REST-style snapshot) ───────────────────────────────────
function PriceTable({ prices }) {
  const rows = Object.entries(prices).slice(0, 5);
  return (
    <section>
      <h2 className="text-[11px] font-bold tracking-widest uppercase text-slate-300 mb-3">
        Mercado en vivo
      </h2>
      {/* Mobile cards */}
      <div className="sm:hidden grid grid-cols-1 gap-2">
        {rows.map(([sym, d]) => (
          <div key={sym} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-white">{sym}/USD</p>
              <p className={`text-xs font-bold ${d.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmtChange(d.change24h)}
              </p>
            </div>
            <p className="mt-1 text-sm font-mono text-slate-200">
              {fmtUsd(d.price, d.price >= 1 ? 2 : 6)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Volumen: {fmtUsd(d.volume24h)}</p>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white/5 text-slate-400 text-left">
              <th className="px-4 py-2 font-semibold">Par</th>
              <th className="px-4 py-2 font-semibold text-right">Precio</th>
              <th className="px-4 py-2 font-semibold text-right">24h</th>
              <th className="px-4 py-2 font-semibold text-right">Volumen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([sym, d]) => (
              <tr key={sym} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-2.5 font-bold text-white">{sym}/USD</td>
                <td className="px-4 py-2.5 text-right font-mono text-slate-200">
                  {fmtUsd(d.price, d.price >= 1 ? 2 : 6)}
                </td>
                <td className={`px-4 py-2.5 text-right font-mono font-semibold ${d.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmtChange(d.change24h)}
                </td>
                <td className="px-4 py-2.5 text-right text-slate-500">
                  {fmtUsd(d.volume24h)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Transfer row ─────────────────────────────────────────────────────────────
function TransferRow({ emoji, label, sub, amount, out }) {
  return (
    <li className="flex items-start sm:items-center gap-3 px-3 sm:px-4 py-3 hover:bg-white/5 transition-colors rounded-xl">
      <span className="text-2xl" aria-hidden="true">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200 leading-tight break-words">{label}</p>
        <p className="text-xs text-slate-500 mt-1 leading-tight break-words">{sub}</p>
      </div>
      <span className={`text-sm font-bold font-mono shrink-0 ${out ? 'text-red-400' : 'text-emerald-400'}`}>
        {out ? '-' : '+'}{fmtUsd(amount)}
      </span>
    </li>
  );
}

// ── Connection badge ──────────────────────────────────────────────────────────
function WSBadge({ connected, lastUpdate }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest">
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
      <span className={connected ? 'text-emerald-400' : 'text-slate-500'}>
        {connected ? 'WS conectado' : 'Conectando...'}
      </span>
      {lastUpdate && (
        <span className="hidden sm:inline text-slate-600 ml-1 normal-case tracking-normal">
          · {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </span>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function TradingDashboard() {
  const navigate  = useNavigate();
  const { usuario } = useContext(AuthContext);
  const { prices, connected, lastUpdate } = useMarketData();
  const { balance, loading }              = useBalance();
  const rolUsuario = String(usuario?.rol || '').toLowerCase();
  const esAdmin = rolUsuario === 'admin' || rolUsuario === 'admin_lite' || rolUsuario === 'administrador';

  const [toast, setToast] = useState(null);
  const [activePanel, setActivePanel] = useState('casa');

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  // ── Action blocks config ─────────────────────────────────────────────────
  const actionBlocks = useMemo(() => [
    {
      category:    'casa',
      title:       'Saldos',
      icon:        '💼',
      description: 'Consulta tu Saldo Chain, depósitos, compras y movimientos desde tu wallet.',
      action:      'Ir a saldos',
      accentColor: 'bg-blue-700',
      badge:       'CLAVE',
      badgeColor:  'bg-blue-500',
      metric:      `Disponible: ${fmtUsd(balance?.usd)}`,
      onClick:     () => navigate('/saldos'),
    },
    {
      category:    'casa',
      title:       'Transferencias',
      icon:        '💸',
      description: 'Envía y recibe fondos entre cuentas Banco Exclusivo con validaciones en tiempo real.',
      action:      'Abrir transferencias',
      accentColor: 'bg-cyan-700',
      metric:      'Internas, bancarias e internacionales',
      onClick:     () => navigate('/transferencias'),
    },
    {
      category:    'casa',
      title:       'Panel de control',
      icon:        '⚙️',
      description: esAdmin
        ? 'Administra usuarios, depósitos, préstamos y configuración avanzada del sistema.'
        : 'Acceso disponible solo para administradores autorizados.',
      action:      esAdmin ? 'Abrir panel' : 'Solo admin',
      accentColor: 'bg-violet-700',
      badge:       esAdmin ? 'ADMIN' : 'RESTRINGIDO',
      badgeColor:  esAdmin ? 'bg-violet-500' : 'bg-slate-600',
      disabled:    !esAdmin,
      metric:      esAdmin ? 'Acceso total' : 'Permisos insuficientes',
      onClick:     () => {
        if (esAdmin) {
          navigate('/admin');
          return;
        }
        notify('Este módulo requiere permisos de administrador.');
      },
    },
    {
      category:    'trading',
      title:       'Comprar activos digitales',
      icon:        '💳',
      description: 'Deposita USD vía PayPal, convierte a saldo Chain y compra cualquier activo digital al instante.',
      action:      'Comprar ahora',
      accentColor: 'bg-indigo-600',
      badge:       'DIRECTO',
      badgeColor:  'bg-indigo-500',
      metric:      `Saldo: ${fmtUsd(balance?.usd)}`,
      onClick:     () => navigate('/saldos', { state: { openFlow: 'deposit' } }),
    },
    {
      category:    'trading',
      title:       'Trading básico',
      icon:        '📈',
      description: 'Compra y vende activos al precio de mercado con liquidación inmediata.',
      action:      'Ir al trading',
      accentColor: 'bg-emerald-600',
      badge:       'LIVE',
      badgeColor:  'bg-emerald-500',
      metric:      `BTC ${fmtUsd(prices.BTC?.price)} · ETH ${fmtUsd(prices.ETH?.price)}`,
      onClick:     () => navigate('/mi-inversion'),
    },
    {
      category:    'trading',
      title:       'Trading avanzado',
      icon:        '⚡',
      description: 'Apalancamiento hasta 10×, contratos perpetuos y opciones sobre activos clave.',
      action:      'Abrir posición',
      accentColor: 'bg-amber-600',
      badge:       'BETA',
      badgeColor:  'bg-amber-500',
      metric:      `SOL ${fmtUsd(prices.SOL?.price)} · BNB ${fmtUsd(prices.BNB?.price)}`,
      onClick:     () => notify('Trading avanzado — próximamente disponible'),
    },
    {
      category:    'trading',
      title:       'Staking & Ahorro',
      icon:        '🏦',
      description: 'Bloquea tus activos y gana recompensas de hasta 18 % APY en stablecoins y PoS tokens.',
      action:      'Ver rendimientos',
      accentColor: 'bg-teal-600',
      badge:       'APY 18%',
      badgeColor:  'bg-teal-500',
      metric:      `En staking: ${fmtUsd(balance?.staked)}`,
      onClick:     () => notify('Staking abierto — flujo de configuración próximamente'),
    },
    {
      category:    'servicios',
      title:       'Préstamos con colateral',
      icon:        '🔐',
      description: 'Obtén liquidez en USD usando tus cripto como garantía sin venderlas. LTV hasta 70 %.',
      action:      'Solicitar préstamo',
      accentColor: 'bg-rose-700',
      metric:      `Colateral bloqueado: ${fmtUsd(balance?.collateral)}`,
      onClick:     () => navigate('/prestamos'),
    },
    {
      category:    'servicios',
      title:       'Marketplace NFT',
      icon:        '🖼️',
      description: 'Compra, vende o subasta coleccionables digitales únicos verificados en blockchain.',
      action:      'Explorar colección',
      accentColor: 'bg-purple-700',
      badge:       'NUEVO',
      badgeColor:  'bg-purple-500',
      metric:      `NFTs en cartera: ${balance?.nfts ?? '—'}`,
      onClick:     () => notify('Marketplace NFT — disponible pronto'),
    },
    {
      category:    'servicios',
      title:       'Tarjeta virtual & pagos',
      icon:        '💎',
      description: 'Paga en cualquier comercio con tu saldo Chain. Límite mensual configurable.',
      action:      'Gestionar tarjeta',
      accentColor: 'bg-sky-700',
      metric:      balance
        ? `Usado: ${fmtUsd(balance.cardSpent)} / ${fmtUsd(balance.cardLimit)}`
        : '—',
      onClick:     () => notify('Tarjeta virtual — configuración en curso'),
    },
  ], [balance, prices, navigate, esAdmin]);

  const visibleActions = useMemo(() => {
    if (activePanel === 'casa') {
      return actionBlocks.filter((block) => block.category === 'casa');
    }

    if (activePanel === 'trading') {
      return actionBlocks.filter((block) => block.category === 'trading');
    }

    if (activePanel === 'servicios') {
      return actionBlocks.filter((block) => block.category === 'servicios');
    }

    return [];
  }, [actionBlocks, activePanel]);

  const actionsTitle = activePanel === 'trading'
    ? 'Opciones de trading'
    : activePanel === 'servicios'
      ? 'Servicios financieros'
      : 'Accesos principales';

  // ── Sample transfers ──────────────────────────────────────────────────────
  const transfers = [
    { emoji: '📤', label: 'Compra ETH',          sub: 'Trading básico · hace 5 min',   amount: 350.00, out: true  },
    { emoji: '📥', label: 'Depósito PayPal',      sub: 'Saldo Chain · hace 23 min',     amount: 500.00, out: false },
    { emoji: '📤', label: 'Préstamo — colateral', sub: 'Bloqueado BTC · hace 1 h',      amount: 1_200, out: true  },
    { emoji: '📥', label: 'Recompensa Staking',   sub: 'ADA yield · hace 3 h',          amount: 14.82, out: false },
    { emoji: '📤', label: 'Compra NFT #0472',     sub: 'Marketplace · hace 1 día',      amount: 89.00, out: true  },
    { emoji: '💳', label: 'Pago tarjeta virtual', sub: 'Amazon.com · hace 2 días',      amount: 47.50, out: true  },
  ];

  return (
    // #tw-root scopes Tailwind's base/reset so it doesn't break MUI globally
    <div id="tw-root" className="w-full">
      <div className="min-h-screen bg-[#0a0d14] text-slate-100 font-sans">

      {/* ── Toast notification ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl animate-[fadeIn_0.3s_ease-out]">
          {toast}
        </div>
      )}

      {/* ── Live ticker ── */}
      <TickerBar prices={prices} />

      {/* ── Header ── */}
      <header className="px-3 sm:px-6 pt-4 sm:pt-6 pb-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">
              Banco Exclusivo <span className="text-indigo-400">Trade</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Panel de productos financieros</p>
          </div>
          <WSBadge connected={connected} lastUpdate={lastUpdate} />
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="px-3 sm:px-6 pb-28 sm:pb-16 space-y-6 sm:space-y-8 max-w-5xl mx-auto mt-2 sm:mt-4">

        {/* ── Opciones del dashboard ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
              Opciones del dashboard
            </h2>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              Vista activa: {DASHBOARD_OPTIONS.find((opt) => opt.id === activePanel)?.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1">
            {DASHBOARD_OPTIONS.map((option) => {
              const active = activePanel === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setActivePanel(option.id)}
                  className={`
                    dashboard-option-chip shrink-0 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2
                    text-[10px] sm:text-xs leading-none font-semibold border transition-colors whitespace-nowrap
                    ${
                      active
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }
                  `}
                >
                  <span className="opt-icon mr-1" aria-hidden="true">{option.icon}</span>
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Balance */}
        {(activePanel === 'casa' || activePanel === 'datos') && (
          <BalanceCard balance={balance} loading={loading} />
        )}

        {/* Cotizaciones en vivo */}
        {(activePanel === 'casa' || activePanel === 'datos') && (
          <PriceTable prices={prices} />
        )}

        {/* ── ACCIONES RÁPIDAS ── */}
        {(activePanel === 'casa' || activePanel === 'trading' || activePanel === 'servicios') && (
          <section>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
                {actionsTitle}
              </h2>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                {visibleActions.length} módulos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleActions.map((block) => (
                <ActionBlock key={block.title} {...block} />
              ))}
            </div>
          </section>
        )}

        {/* ── TRANSFERENCIAS ── */}
        {(activePanel === 'casa' || activePanel === 'transferencias') && (
        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
              Transferencias recientes
            </h2>
            <button
              onClick={() => navigate('/transferencias')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Ver todas →
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1e2535] to-[#111827] overflow-hidden">
            {/* Totals row */}
            <div className="grid grid-cols-2 divide-x divide-white/10 border-b border-white/10">
              <div className="px-3 sm:px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Enviado</p>
                <p className="text-base font-extrabold text-red-400 font-mono">
                  {fmtUsd(transfers.filter(t => t.out).reduce((s, t) => s + t.amount, 0))}
                </p>
              </div>
              <div className="px-3 sm:px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Recibido</p>
                <p className="text-base font-extrabold text-emerald-400 font-mono">
                  {fmtUsd(transfers.filter(t => !t.out).reduce((s, t) => s + t.amount, 0))}
                </p>
              </div>
            </div>

            {/* Transfer list */}
            <ul>
              {transfers.map((t) => (
                <TransferRow key={`${t.label}-${t.amount}`} {...t} />
              ))}
            </ul>
          </div>
        </section>
        )}

        {/* Footer note */}
        <p className="text-center text-[11px] text-slate-700 pb-4">
          Precios simulados · Para producción conectar WS real · Banco Exclusivo © 2026
        </p>
      </main>
      </div>
    </div>
  );
}
