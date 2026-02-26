import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './DashboardInversionContainer.css';

const DashboardInversionContainer = () => {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const [inversiones, setInversiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saldoTotal, setSaldoTotal] = useState(0);
  const [gananciaTotal, setGananciaTotal] = useState(0);

  useEffect(() => {
    if (!usuario?.id) {
      setInversiones([]);
      setSaldoTotal(0);
      setGananciaTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    cargarInversiones();
  }, [usuario]);

  const cargarInversiones = async () => {
    try {
      const response = await api.get(`/fondo-riesgo/analysis/${usuario.id}`);
      const data = response.data || [];
      setInversiones(data);

      // Calcular totales
      const totalMonto = data.reduce((sum, inv) => sum + (parseFloat(inv.monto) || 0), 0);
      const totalGanancia = data.reduce((sum, inv) => sum + (parseFloat(inv.crecimiento) || 0), 0);
      
      setSaldoTotal(totalMonto);
      setGananciaTotal(totalGanancia);
    } catch (error) {
      console.error('Error cargando inversiones:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="dashboard-section">
        <h2>💹 Mis Inversiones</h2>
        <div className="loading-inversiones">Cargando inversiones...</div>
      </section>
    );
  }

  if (inversiones.length === 0) {
    return (
      <section className="dashboard-section">
        <h2>💹 Mis Inversiones</h2>
        <div className="no-inversiones">
          <p>📊 Aún no tienes inversiones registradas</p>
          <p className="sub-text">Contacta al administrador para comenzar a invertir</p>
        </div>
      </section>
    );
  }

  const saldoFinal = saldoTotal + gananciaTotal;

  return (
    <section className="dashboard-section">
      <h2>💹 Mis Inversiones</h2>
      
      <div className="inversiones-overview">
        <div className="inversion-card primary">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <div className="card-label">Monto Invertido</div>
            <div className="card-amount">${saldoTotal.toFixed(2)}</div>
          </div>
        </div>

        <div className="inversion-card success">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-label">Ganancia Acumulada</div>
            <div className="card-amount positive">+${gananciaTotal.toFixed(2)}</div>
          </div>
        </div>

        <div className="inversion-card highlight">
          <div className="card-icon">💎</div>
          <div className="card-content">
            <div className="card-label">Saldo Total</div>
            <div className="card-amount">${saldoFinal.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="inversiones-list">
        <h3>📋 Detalle de Inversiones</h3>
        <div className="inversiones-grid">
          {inversiones.slice(0, 3).map((inv, idx) => (
            <div key={idx} className="inversion-item">
              <div className="inversion-header">
                <span className="inversion-label">Inversión #{idx + 1}</span>
                <span className="inversion-percentage">{inv.porcentaje}%</span>
              </div>
              <div className="inversion-details">
                <div className="detail-row">
                  <span className="detail-label">Monto:</span>
                  <span className="detail-value">${parseFloat(inv.monto).toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Crecimiento:</span>
                  <span className="detail-value success">+${parseFloat(inv.crecimiento || 0).toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Fecha:</span>
                  <span className="detail-value">{inv.fechaRegistro}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        className="btn-ver-mas-inversiones" 
        onClick={() => navigate('/mi-inversion')}
      >
        📊 Ver Análisis Completo
      </button>
    </section>
  );
};

export default DashboardInversionContainer;
