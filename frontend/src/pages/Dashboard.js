import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api, { transferAPI, loanAPI, depositoAPI } from '../services/api';
import './Dashboard.css';

// Acciones rápidas (Tekers)
const TEKERS = [
  { id: 'recargar',   label: 'Recargar',   icon: '💳', route: '/recargas',                  color: '#1d4ed8' },
  { id: 'transferir', label: 'Transferir', icon: '📤', route: '/transferencias',             color: '#7c3aed' },
  { id: 'retirar',    label: 'Retirar',    icon: '🏧', route: '/retiros',                    color: '#047857' },
  { id: 'prestamos',  label: 'Préstamos',  icon: '🏦', route: '/prestamos',                  color: '#b45309' },
  { id: 'invertir',   label: 'Invertir',   icon: '📈', route: '/mi-inversion',               color: '#0e7490' },
  { id: 'grupo',      label: 'Mi Grupo',   icon: '👥', route: '/tu-grupo',                   color: '#be185d' },
  { id: 'gastos',     label: 'Gastos',     icon: '📊', route: '/gastos-personales',          color: '#ca8a04' },
  { id: 'cursos',     label: 'Cursos',     icon: '🎓', route: '/cursos',                     color: '#4338ca' },
];

const CRYPTO_ACTIONS = [
  { id: 'depositar', label: 'Depositar', icon: '↓', helper: 'PayPal o código', route: '/saldos', state: { openFlow: 'deposit' } },
  { id: 'comprar', label: 'Comprar', icon: '◈', helper: 'Orden de mercado', route: '/saldos', state: { openFlow: 'buy' } },
  { id: 'transferir', label: 'Transferir', icon: '↑', helper: 'Enviar saldo', route: '/saldos', state: { openFlow: 'transfer' } },
  { id: 'crypto-wallet', label: 'Wallet', icon: 'W', helper: 'Panel completo', route: '/saldos' },
];

// Activos favoritos (data estática, en una app real vendría del perfil de usuario)
const FAVORITES = [
  { id: 'btc',  label: 'Bitcoin',    symbol: 'BTC',  icon: '₿',    color: '#f7931a', change: '+2.4%',  up: true  },
  { id: 'eth',  label: 'Ethereum',   symbol: 'ETH',  icon: 'Ξ',    color: '#627eea', change: '-0.8%',  up: false },
  { id: 'dop',  label: 'Peso Dom.',  symbol: 'DOP',  icon: 'RD$',  color: '#003087', change: '+0.1%',  up: true  },
  { id: 'aapl', label: 'Apple',      symbol: 'AAPL', icon: '',    color: '#6b7280', change: '+1.2%',  up: true  },
];

export default function Dashboard() {
  const { usuario, loading, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [transferencias, setTransferencias] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [paypalTotal, setPaypalTotal] = useState(0);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [saldoInversion, setSaldoInversion] = useState(0);
  const [gananciaInversion, setGananciaInversion] = useState(0);
  const [cargandoInversion, setCargandoInversion] = useState(true);

  const formatMoney = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
  };

  // Redirigir a login si no hay usuario y no está cargando
  React.useEffect(() => {
    if (!usuario && !loading) navigate('/login');
  }, [usuario, loading, navigate]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [transResponse, prestResponse, paypalResponse] = await Promise.all([
          transferAPI.obtenerHistorial(),
          loanAPI.obtenerMios(),
          depositoAPI.obtenerResumenPayPal(),
        ]);
        setTransferencias(transResponse.data.slice(0, 5));
        setPrestamos(prestResponse.data.slice(0, 5));
        setPaypalTotal(Number(paypalResponse.data?.totalPayPal || 0));
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoadingDatos(false);
      }
    };
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!usuario?.id) {
      setSaldoInversion(0);
      setGananciaInversion(0);
      setCargandoInversion(false);
      return;
    }
    const cargarInversion = async () => {
      try {
        setCargandoInversion(true);
        const response = await api.get(`/fondo-riesgo/analysis/${usuario.id}`);
        const data = response.data || [];
        setSaldoInversion(data.reduce((s, inv) => s + (parseFloat(inv.monto) || 0), 0));
        setGananciaInversion(data.reduce((s, inv) => s + (parseFloat(inv.crecimiento) || 0), 0));
      } catch (error) {
        console.error('Error cargando inversiones:', error);
        setSaldoInversion(0);
        setGananciaInversion(0);
      } finally {
        setCargandoInversion(false);
      }
    };
    cargarInversion();
  }, [usuario]);

  const prestamosActivos = prestamos.filter((p) => {
    const e = (p.estado || '').toLowerCase();
    return e && e !== 'pagado' && e !== 'rechazado';
  });

  const saldoPrestamos = prestamosActivos.reduce((s, p) => {
    const sn = Number(p.saldoNegativo ?? 0);
    return s + (Number.isFinite(sn) ? sn : 0);
  }, 0);

  const transferenciasEnviadas  = transferencias.filter(t => t.remitente?._id === usuario?._id);
  const transferenciasRecibidas = transferencias.filter(t => t.remitente?._id !== usuario?._id);
  const nombreCompleto = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ') || 'Usuario';
  const patrimonioEstimado =
    (Number(usuario?.saldo) || 0) + paypalTotal + saldoInversion + gananciaInversion - saldoPrestamos;
  const actividadReciente = transferencias[0]?.fechaTransferencia
    ? new Date(transferencias[0].fechaTransferencia).toLocaleDateString('es-ES')
    : 'Sin movimientos recientes';
  const operacionesMonitoreadas = transferencias.length + prestamos.length;
  const handleCryptoAction = (action) => navigate(action.route, action.state ? { state: action.state } : undefined);

  if (loading) {
    return (
      <div className="db-spinner-wrap" role="status" aria-label="Cargando">
        <div className="db-spinner" />
      </div>
    );
  }

  return (
    <div className="db-root">
      <div className="db-shell">

        {/* ── SIDEBAR (solo desktop) ── */}
        <aside className="db-sidebar" aria-label="Menú principal">
          <div className="db-sidebar-brand">
            <img src="/imagen/BE (1) (1).png" alt="Banco Exclusivo" className="db-logo" />
            <span className="db-sidebar-brand-name">Banco Exclusivo</span>
          </div>
          <nav className="db-sidebar-nav" aria-label="Acciones rápidas">
            {TEKERS.map(teker => (
              <button
                key={teker.id}
                className="db-nav-item"
                style={{ '--nav-color': teker.color }}
                onClick={() => navigate(teker.route)}
                aria-label={teker.label}
              >
                <span className="db-nav-icon" aria-hidden="true">{teker.icon}</span>
                <span className="db-nav-label">{teker.label}</span>
              </button>
            ))}
          </nav>
          <div className="db-sidebar-foot">
            <div className="db-sidebar-user-info">
              <span className="db-sidebar-user-name">{nombreCompleto}</span>
              <span className="db-sidebar-user-role">Cliente</span>
            </div>
            <button
              className="db-sidebar-logout"
              onClick={() => { logout(); navigate('/login'); }}
              aria-label="Cerrar sesión"
            >
              🚪
            </button>
          </div>
        </aside>

        {/* ── ÁREA DE CONTENIDO ── */}
        <div className="db-content-area">
        <header className="db-header" role="banner">
          <div className="db-header-left">
            <img src="/imagen/BE (1) (1).png" alt="Banco Exclusivo" className="db-logo" />
            <div>
              <p className="db-welcome-label">Bienvenido,</p>
              <p className="db-welcome-name">{nombreCompleto}</p>
            </div>
          </div>
          <button
            className="db-logout-btn"
            onClick={() => { logout(); navigate('/login'); }}
            aria-label="Cerrar sesión"
          >
            <span aria-hidden="true">🚪</span>
            <span className="db-logout-text">Salir</span>
          </button>
        </header>

        <main className="db-main" aria-label="Contenido principal del dashboard">
          <section aria-labelledby="dashboard-overview-heading" className="db-section db-hero">

            {/* Bienvenida + acciones */}
            <div className="db-hero-welcome">
              <div className="db-hero-heading">
                <p className="db-hero-kicker">Mesa cripto</p>
                <h1 id="dashboard-overview-heading" className="db-hero-title">{nombreCompleto}</h1>
                <p className="db-hero-summary">
                  Entradas directas para depósitos, compra de crypto y transferencias desde una sola wallet.
                </p>
              </div>
              <button
                className="db-hero-overview-btn"
                onClick={() => navigate('/saldos')}
                aria-label="Ver mi cartera"
              >
                Ver cartera
              </button>
            </div>

            <div className="db-crypto-bar" role="list" aria-label="Operaciones rápidas de cripto">
              {CRYPTO_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  className="db-crypto-action"
                  onClick={() => handleCryptoAction(action)}
                  role="listitem"
                  aria-label={action.label}
                >
                  <span className="db-crypto-icon" aria-hidden="true">{action.icon}</span>
                  <span className="db-crypto-meta">
                    <span className="db-crypto-label">{action.label}</span>
                    <span className="db-crypto-helper">{action.helper}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Tira de KPI cards */}
            <div className="db-kpi-strip" role="list" aria-label="Resumen de saldos">
              <div className="db-card db-card--balance" role="listitem" aria-label="Saldo disponible">
                <span className="db-card-label">Saldo disponible</span>
                <span className="db-card-amount">${formatMoney(usuario?.saldo)}</span>
                <span className="db-card-sub">Cuenta principal</span>
              </div>
              <div className="db-card db-card--debt" role="listitem" aria-label="Préstamos activos">
                <span className="db-card-label">Préstamos</span>
                <span className="db-card-amount">-RD${formatMoney(saldoPrestamos)}</span>
                <span className="db-card-sub">{prestamosActivos.length} activo(s)</span>
              </div>
              <div className="db-card db-card--invest" role="listitem" aria-label="Saldo de inversión">
                <span className="db-card-label">Inversión</span>
                <span className="db-card-amount">${formatMoney(saldoInversion + gananciaInversion)}</span>
                <span className="db-card-sub">
                  {cargandoInversion ? 'Cargando...' : `+$${formatMoney(gananciaInversion)} ganancia`}
                </span>
              </div>
              <div className="db-card db-card--paypal" role="listitem" aria-label="Recargas PayPal">
                <span className="db-card-label">PayPal</span>
                <span className="db-card-amount">${formatMoney(paypalTotal)}</span>
                <span className="db-card-sub">Total recargado</span>
              </div>
              <div className="db-card db-card--group" role="listitem" aria-label="Tu grupo de ahorro">
                <span className="db-card-label">Grupo</span>
                <span className="db-card-amount db-card-emoji" aria-hidden="true">👥</span>
                <button
                  className="db-card-btn"
                  onClick={() => navigate('/tu-grupo')}
                  aria-label="Ver mi grupo de ahorro"
                >
                  Ver grupo
                </button>
              </div>
            </div>

            {/* Métricas de actividad */}
            <div className="db-hero-metrics" role="list" aria-label="Indicadores de actividad">
              <div className="db-hero-metric" role="listitem">
                <span className="db-hero-metric-label">Patrimonio estimado</span>
                <strong className="db-hero-metric-value">${formatMoney(patrimonioEstimado)}</strong>
              </div>
              <div className="db-hero-metric" role="listitem">
                <span className="db-hero-metric-label">Operaciones visibles</span>
                <strong className="db-hero-metric-value">{operacionesMonitoreadas}</strong>
              </div>
              <div className="db-hero-metric" role="listitem">
                <span className="db-hero-metric-label">Última actividad</span>
                <strong className="db-hero-metric-value">{actividadReciente}</strong>
              </div>
            </div>
          </section>

          <div className="db-board">
            <section aria-labelledby="tekers-heading" className="db-section db-section--quick">
          <h2 id="tekers-heading" className="db-section-title">Acciones rápidas</h2>
          <div className="db-carousel" role="list" aria-label="Acciones destacadas">
            {TEKERS.map(teker => (
              <button
                key={teker.id}
                className="db-teker"
                style={{ '--teker-color': teker.color }}
                onClick={() => navigate(teker.route)}
                role="listitem"
                aria-label={teker.label}
              >
                <span className="db-teker-icon" aria-hidden="true">{teker.icon}</span>
                <span className="db-teker-label">{teker.label}</span>
              </button>
            ))}
          </div>
            </section>

            <section aria-labelledby="favoritos-heading" className="db-section db-section--favorites">
          <h2 id="favoritos-heading" className="db-section-title">Favoritos</h2>
          <div className="db-fav-grid" role="list" aria-label="Activos favoritos">
            {FAVORITES.map(fav => (
              <button
                key={fav.id}
                className="db-fav-card"
                style={{ '--fav-color': fav.color }}
                onClick={() => navigate('/mi-inversion')}
                role="listitem"
                aria-label={`${fav.label}: ${fav.change}`}
              >
                <span className="db-fav-icon" aria-hidden="true">{fav.icon}</span>
                <span className="db-fav-symbol">{fav.symbol}</span>
                <span className={`db-fav-change ${fav.up ? 'db-up' : 'db-down'}`}>
                  {fav.change}
                </span>
              </button>
            ))}
          </div>
            </section>

            <section aria-labelledby="mercado-heading" className="db-section db-section--market">
          <h2 id="mercado-heading" className="db-section-title">Tendencia del mercado</h2>
          <div className="db-market-card">
            <div className="db-market-info">
              <span className="db-market-pair">Peso Dom. / USD</span>
              <span className="db-market-rate">RD$56.50</span>
              <span className="db-market-change db-up">↑ +0.05%</span>
            </div>
            <div className="db-market-chart" aria-hidden="true">
              {[42, 55, 38, 65, 50, 70, 58, 72, 60, 75].map((h, i) => (
                <div key={i} className="db-market-bar" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
            </section>

            <section aria-labelledby="transf-heading" className="db-section db-section--transfers">
          <div className="db-section-header">
            <h2 id="transf-heading" className="db-section-title">Transferencias</h2>
            <button
              className="db-link-btn"
              onClick={() => navigate('/transferencias')}
              aria-label="Ver todas las transferencias"
            >
              Ver todas
            </button>
          </div>

          <div className="db-badge-row" role="group" aria-label="Resumen de transferencias">
            <span className="db-badge db-badge--out" aria-label={`${transferenciasEnviadas.length} transferencias enviadas`}>
              📤 {transferenciasEnviadas.length} enviadas
            </span>
            <span className="db-badge db-badge--in" aria-label={`${transferenciasRecibidas.length} transferencias recibidas`}>
              📥 {transferenciasRecibidas.length} recibidas
            </span>
          </div>

          {loadingDatos ? (
            <p className="db-empty">Cargando...</p>
          ) : transferencias.length === 0 ? (
            <p className="db-empty">No hay transferencias aún</p>
          ) : (
            <ul className="db-list" aria-label="Últimas transferencias">
              {transferencias.map(t => {
                const enviada = t.remitente?._id === usuario?._id;
                return (
                  <li key={t._id} className="db-list-item">
                    <span className={`db-list-badge ${enviada ? 'db-badge--out' : 'db-badge--in'}`} aria-hidden="true">
                      {enviada ? '📤' : '📥'}
                    </span>
                    <div className="db-list-info">
                      <span className="db-list-name">
                        {enviada
                          ? `A: ${t.destinatario?.nombre} ${t.destinatario?.apellido}`
                          : `De: ${t.remitente?.nombre} ${t.remitente?.apellido}`}
                      </span>
                      <span className="db-list-date">
                        {new Date(t.fechaTransferencia).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <span className={`db-list-amount ${enviada ? 'db-neg' : 'db-pos'}`}>
                      {enviada ? '-' : '+'}${formatMoney(t.monto)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
            </section>

            <section aria-labelledby="prestamos-heading" className="db-section db-section--loans">
          <div className="db-section-header">
            <h2 id="prestamos-heading" className="db-section-title">Préstamos</h2>
            <button
              className="db-link-btn"
              onClick={() => navigate('/prestamos')}
              aria-label="Ver detalle de préstamos"
            >
              Ver detalle
            </button>
          </div>

          {loadingDatos ? (
            <p className="db-empty">Cargando...</p>
          ) : prestamos.length === 0 ? (
            <p className="db-empty">No hay préstamos aún</p>
          ) : (
            <ul className="db-list" aria-label="Mis préstamos">
              {prestamos.map(p => (
                <li key={p.id || p._id} className="db-list-item">
                  <span className="db-list-badge db-badge--loan" aria-hidden="true">🏦</span>
                  <div className="db-list-info">
                    <span className="db-list-name">#{p.id || p._id}</span>
                    <span className="db-list-date">{p.plazo} meses · {p.tasaInteres}% anual</span>
                  </div>
                  <div className="db-loan-right">
                    <span className="db-loan-monto">${formatMoney(p.montoSolicitado)}</span>
                    <span className={`db-loan-status db-loan-${(p.estado || '').toLowerCase()}`}>
                      {(p.estado || '').toUpperCase()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            className="db-primary-btn"
            onClick={() => navigate('/prestamos')}
            aria-label="Solicitar un nuevo préstamo"
          >
            + Solicitar préstamo
          </button>
            </section>

            <section aria-labelledby="inversion-heading" className="db-section db-section--investments db-section--last">
          <div className="db-section-header">
            <h2 id="inversion-heading" className="db-section-title">Inversiones</h2>
            <button
              className="db-link-btn"
              onClick={() => navigate('/mi-inversion')}
              aria-label="Ver todas mis inversiones"
            >
              Ver todo
            </button>
          </div>

          <div className="db-invest-card">
            <div className="db-invest-row">
              <span className="db-invest-label">Capital invertido</span>
              <span className="db-invest-value">${formatMoney(saldoInversion)}</span>
            </div>
            <div className="db-invest-row">
              <span className="db-invest-label">Ganancias</span>
              <span className={`db-invest-value ${gananciaInversion >= 0 ? 'db-up' : 'db-down'}`}>
                {gananciaInversion >= 0 ? '+' : ''}${formatMoney(gananciaInversion)}
              </span>
            </div>
            <div className="db-invest-row db-invest-total">
              <span className="db-invest-label">Total</span>
              <span className="db-invest-value">${formatMoney(saldoInversion + gananciaInversion)}</span>
            </div>
          </div>

          <button
            className="db-primary-btn"
            onClick={() => navigate('/mi-inversion')}
            aria-label="Ir a gestionar mis inversiones"
          >
            Gestionar inversiones
          </button>
            </section>
          </div>
        </main>
        </div>{/* db-content-area */}
      </div>
    </div>
  );
}
