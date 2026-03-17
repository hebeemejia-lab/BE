
import DashboardInversionContainer from '../components/DashboardInversionContainer';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api, { transferAPI, loanAPI, depositoAPI } from '../services/api';
import SalaDeSaldos from './SalaDeSaldos';
import MarketTicker from '../components/MarketTicker';
import './Dashboard.css';

export default function Dashboard() {
  const { usuario, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [transferencias, setTransferencias] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [paypalTotal, setPaypalTotal] = useState(0);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [saldoInversion, setSaldoInversion] = useState(0);
  const [gananciaInversion, setGananciaInversion] = useState(0);
  const [cargandoInversion, setCargandoInversion] = useState(true);
  const [mostrarSalaSaldos, setMostrarSalaSaldos] = useState(false);

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'MXN': '$',
      'COP': '$',
      'ARS': '$',
      'CLP': '$',
      'PEN': 'S/',
      'BRL': 'R$',
      'DOP': 'RD$',
    };
    return symbols[currency] || '$';
  };

  const formatMoney = (value) => {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) {
      return numberValue.toFixed(2);
    }
    return '0.00';
  };

  // Redirigir a login si no hay usuario y no está cargando
  React.useEffect(() => {
    if (!usuario && !loading) {
      navigate('/login');
    }
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
        const totalMonto = data.reduce((sum, inv) => sum + (parseFloat(inv.monto) || 0), 0);
        const totalGanancia = data.reduce((sum, inv) => sum + (parseFloat(inv.crecimiento) || 0), 0);
        setSaldoInversion(totalMonto);
        setGananciaInversion(totalGanancia);
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


  // Solo prestamos activos (no pagados ni rechazados)
  const prestamosActivos = prestamos.filter((prestamo) => {
    const estado = (prestamo.estado || '').toLowerCase();
    return estado && estado !== 'pagado' && estado !== 'rechazado';
  });

  // Sumar saldoNegativo real de todos los prestamos activos
  const saldoPrestamos = prestamosActivos.reduce((sum, prestamo) => {
    const saldoNegativo = Number(prestamo.saldoNegativo ?? 0);
    return sum + (Number.isFinite(saldoNegativo) ? saldoNegativo : 0);
  }, 0);

  // Solo mostrar saldo de depósitos en Dashboard
  // eslint-disable-next-line no-unused-vars
  const saldoDepositos = Math.max(Number(usuario?.saldo) || 0, 0);
  const simboloDop = getCurrencySymbol('DOP');
  const simboloUsd = getCurrencySymbol('USD');

  if (mostrarSalaSaldos) {
    // Suma depósito + préstamo
    const saldoPrestamos = prestamos.filter((prestamo) => {
      const estado = (prestamo.estado || '').toLowerCase();
      return estado && estado !== 'pagado' && estado !== 'rechazado';
    }).reduce((sum, prestamo) => sum + (Number(prestamo.saldoNegativo ?? 0)), 0);
    const depositoPrestamo = (Number(usuario?.saldo) || 0) + saldoPrestamos;
    return (
      <SalaDeSaldos
        saldoPrestamos={saldoPrestamos}
        saldoPaypal={paypalTotal}
        saldoInversion={saldoInversion + gananciaInversion}
        depositoPrestamo={depositoPrestamo}
        onTuGrupoClick={() => navigate('/tu-grupo')}
      />
    );
  }

  return (
    <div className="dashboard-container">
      <MarketTicker position="web" />
      <div className="dashboard-header">
        <h1>Bienvenido, <span className="user-nombre">{usuario?.nombre}</span> <span className="user-apellido">{usuario?.apellido}</span>!</h1>
        <p>Aquí está el resumen de tu cuenta</p>
        <button
          className="btn-dashboard-sala"
          style={{ marginTop: 16, padding: '8px 24px', borderRadius: 8, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 700, fontSize: 18, cursor: 'pointer' }}
          onClick={() => setMostrarSalaSaldos(true)}
        >
          Dashboard
        </button>
      </div>

      <div className="account-overview">
        <div className="overview-card debt">
          <div className="overview-label">Prestamos en negativo</div>
          <div className="overview-amount">
            -{simboloDop}{formatMoney(saldoPrestamos)}
          </div>
          <div className="debt-list">
            {prestamosActivos.length > 0 ? (
              prestamosActivos.map((prestamo) => (
                <div key={prestamo.id || prestamo._id} className="debt-item">
                  <span className="debt-id">ID #{prestamo.id || prestamo._id}</span>
                  <span className="debt-amount">{simboloDop}{formatMoney(prestamo.saldoNegativo ?? 0)}</span>
                </div>
              ))
            ) : (
              <span className="debt-empty">Sin prestamos activos</span>
            )}
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-label">Recargas PayPal</div>
          <div className="overview-amount">
            {simboloUsd}{formatMoney(paypalTotal)}
          </div>
          <div className="overview-meta">Saldo recargado via PayPal</div>
        </div>
        <div className="overview-card investment">
          <div className="overview-label">Saldo inversion</div>
          <div className="overview-amount">
            {simboloUsd}{formatMoney(saldoInversion + gananciaInversion)}
          </div>
          <div className="overview-meta">
            {cargandoInversion
              ? 'Cargando inversiones...'
              : `Ganancia: ${simboloUsd}${formatMoney(gananciaInversion)}`}
          </div>
        </div>
        <div className="overview-card group">
          <div className="overview-label">Tu grupo</div>
          <div className="overview-amount">
            👥
          </div>
          <div className="overview-meta">
            Ahorro comunitario
          </div>
          <button
            className="btn-ver-grupo"
            style={{marginTop: 8, padding: '6px 18px', borderRadius: 8, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => navigate('/tu-grupo')}
          >
            Ver grupo
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stats-card">
          <div className="stat">
            <img src="/imagen/BE (9).png" alt="Estadísticas" className="stat-icon-img" />
            <span className="stat-label">Transferencias</span>
            <span className="stat-value">{transferencias.length}</span>
          </div>
          <div className="stat">
            <span className="stat-icon">📋</span>
            <span className="stat-label">Préstamos</span>
            <span className="stat-value">{prestamos.length}</span>
          </div>
        </div>
      </div>

      {loadingDatos ? (
        <div className="loading">Cargando datos...</div>
      ) : (
        <>
          <section className="dashboard-section">
            <h2>Últimas Transferencias</h2>
            <div className="transaction-list">
              {transferencias.length > 0 ? (
                transferencias.map((trans) => (
                  <div key={trans._id} className="transaction-item">
                    <div className="transaction-info">
                      <span className="transaction-type">
                        {trans.remitente._id === usuario?._id ? '📤 Enviada' : '📥 Recibida'}
                      </span>
                      <span className="transaction-person">
                        {trans.remitente._id === usuario?._id
                          ? `A: ${trans.destinatario.nombre} ${trans.destinatario.apellido}`
                          : `De: ${trans.remitente.nombre} ${trans.remitente.apellido}`}
                      </span>
                    </div>
                    <div className="transaction-amount">
                      <span className={`amount ${trans.remitente._id === usuario?._id ? 'negative' : 'positive'}`}>
                        {trans.remitente._id === usuario?._id ? '-' : '+'}${formatMoney(trans.monto)}
                      </span>
                      <span className="transaction-date">
                        {new Date(trans.fechaTransferencia).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No hay transferencias aún</p>
              )}
            </div>
          </section>

          <section className="dashboard-section">
            <h2>Mis Préstamos</h2>
            <div className="loan-list">
              {prestamos.length > 0 ? (
                prestamos.map((prestamo) => (
                  <div key={prestamo.id || prestamo._id} className={`loan-item ${prestamo.estado}`}>
                    <div className="loan-header">
                      <span className="loan-amount">${formatMoney(prestamo.montoSolicitado)}</span>
                      <span className={`loan-status ${prestamo.estado}`}>{prestamo.estado.toUpperCase()}</span>
                    </div>
                    <div className="loan-details">
                      <span>Plazo: {prestamo.plazo} meses</span>
                      <span>Tasa: {prestamo.tasaInteres}% anual</span>
                    </div>
                    {prestamo.cuotas && prestamo.cuotas.length > 0 && (
                      <div className="cuotas-lista-dashboard">
                        <h4 style={{margin: '8px 0 4px 0', fontSize: 14}}>Cuotas:</h4>
                        {prestamo.cuotas.map((cuota) => {
                          const pagado = Number(cuota.montoPagado) >= Number(cuota.montoCuota);
                          const parcial = !pagado && Number(cuota.montoPagado) > 0;
                          const porcentaje = Math.min(100, Math.round((Number(cuota.montoPagado) / Number(cuota.montoCuota)) * 100));
                          return (
                            <div key={cuota.id} className={`cuota-item-dashboard ${pagado ? 'pagada' : parcial ? 'parcial' : 'pendiente'}`} style={{marginBottom: 6, padding: 6, borderRadius: 4, background: pagado ? '#e0ffe0' : parcial ? '#fffbe0' : '#ffe0e0'}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                <span style={{textDecoration: pagado ? 'line-through' : 'none', fontWeight: pagado ? 600 : 400}}>
                                  Cuota #{cuota.numeroCuota}: ${formatMoney(cuota.montoCuota)}
                                </span>
                                {pagado ? (
                                  <span style={{color: '#2e7d32', fontWeight: 500}}>Pagada</span>
                                ) : parcial ? (
                                  <span style={{color: '#bfa100', fontWeight: 500}}>Abonada: ${formatMoney(cuota.montoPagado)}</span>
                                ) : (
                                  <span style={{color: '#b21d2b', fontWeight: 500}}>Pendiente</span>
                                )}
                              </div>
                              {parcial && (
                                <div style={{marginTop: 2, width: 120, height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden'}}>
                                  <div style={{width: `${porcentaje}%`, height: '100%', background: '#ffe066'}}></div>
                                </div>
                              )}
                              <div style={{fontSize: 11, color: '#888', marginTop: 2}}>
                                {cuota.fechaVencimiento && (
                                  pagado
                                    ? `Pagada: ${new Date(cuota.fechaPago).toLocaleDateString('es-ES')}`
                                    : `Vence: ${new Date(cuota.fechaVencimiento).toLocaleDateString('es-ES')}`
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="empty-state">No hay préstamos aún</p>
              )}
            </div>
          </section>
        </>
      )}
      <DashboardInversionContainer />
    </div>
  );
}



