import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { transferAPI, loanAPI } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const { usuario, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [transferencias, setTransferencias] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(true);

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
        const [transResponse, prestResponse] = await Promise.all([
          transferAPI.obtenerHistorial(),
          loanAPI.obtenerMios(),
        ]);
        setTransferencias(transResponse.data.slice(0, 5));
        setPrestamos(prestResponse.data.slice(0, 5));
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoadingDatos(false);
      }
    };

    cargarDatos();
  }, []);

  const prestamosActivos = prestamos.filter((prestamo) => {
    const estado = (prestamo.estado || '').toLowerCase();
    return estado && estado !== 'pagado' && estado !== 'rechazado';
  });

  const deudaTotal = prestamosActivos.reduce((sum, prestamo) => {
    const monto = Number(prestamo.montoAprobado ?? prestamo.montoSolicitado ?? prestamo.monto ?? 0);
    return sum + (Number.isFinite(monto) ? monto : 0);
  }, 0);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Bienvenido, <span className="user-nombre">{usuario?.nombre}</span> <span className="user-apellido">{usuario?.apellido}</span>!</h1>
        <p>Aquí está el resumen de tu cuenta</p>
      </div>

      <div className="account-overview">
        <div className="overview-card">
          <div className="overview-label">Saldo de la cuenta</div>
          <div className="overview-amount">
            {getCurrencySymbol(usuario?.moneda)}{formatMoney(usuario?.saldo)}
          </div>
          <div className="overview-meta">Disponible para transacciones</div>
        </div>
        <div className="overview-card debt">
          <div className="overview-label">Saldo negativo de préstamos</div>
          <div className="overview-amount">
            -{getCurrencySymbol(usuario?.moneda)}{formatMoney(deudaTotal)}
          </div>
          <div className="debt-list">
            {prestamosActivos.length > 0 ? (
              prestamosActivos.map((prestamo) => (
                <div key={prestamo.id || prestamo._id} className="debt-item">
                  <span className="debt-id">ID #{prestamo.id || prestamo._id}</span>
                  <span className="debt-amount">{getCurrencySymbol(usuario?.moneda)}{formatMoney(prestamo.montoAprobado ?? prestamo.montoSolicitado ?? prestamo.monto)}</span>
                </div>
              ))
            ) : (
              <span className="debt-empty">Sin préstamos activos</span>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="balance-card">
          <div className="balance-content">
            <span className="balance-label">Saldo Disponible</span>
          </div>
          <div className="balance-amount-row">
            <span className="balance-amount">{getCurrencySymbol(usuario?.moneda)}{formatMoney(usuario?.saldo)}</span>
            <span className="balance-icon">{getCurrencySymbol(usuario?.moneda)}</span>
          </div>
        </div>

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
                  <div key={prestamo._id} className={`loan-item ${prestamo.estado}`}>
                    <div className="loan-header">
                      <span className="loan-amount">${formatMoney(prestamo.montoSolicitado)}</span>
                      <span className={`loan-status ${prestamo.estado}`}>{prestamo.estado.toUpperCase()}</span>
                    </div>
                    <div className="loan-details">
                      <span>Plazo: {prestamo.plazo} meses</span>
                      <span>Tasa: {prestamo.tasaInteres}% anual</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No hay préstamos aún</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
