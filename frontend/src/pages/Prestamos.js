import React, { useState, useContext, useEffect } from 'react';
import { loanAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Prestamos.css';

export default function Prestamos() {
  const [monto, setMonto] = useState('');
  const [plazo, setPlazo] = useState('12');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [prestamos, setPrestamos] = useState([]);
  const { usuario } = useContext(AuthContext);

  useEffect(() => {
    cargarPrestamos();
  }, []);

  const cargarPrestamos = async () => {
    try {
      const response = await loanAPI.obtenerMios();
      setPrestamos(response.data);
    } catch (error) {
      console.error('Error cargando préstamos:', error);
    }
  };

  const calcularCuota = () => {
    if (!monto || !plazo) return 0;
    const tasaMensual = 5 / 12 / 100; // 5% anual
    const numeroCuotas = parseInt(plazo);
    const cuota =
      (monto * tasaMensual * Math.pow(1 + tasaMensual, numeroCuotas)) /
      (Math.pow(1 + tasaMensual, numeroCuotas) - 1);
    return cuota.toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await loanAPI.solicitar({
        montoSolicitado: parseFloat(monto),
        plazo: parseInt(plazo),
      });

      setSuccess('Solicitud de préstamo enviada exitosamente');
      setMonto('');
      setPlazo('12');
      cargarPrestamos();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error en la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prestamos-container">
      <div className="prestamos-header">
        <h1>Solicitar Préstamo</h1>
        <p>Obtén el crédito que necesitas con tasas justas</p>
      </div>

      <div className="prestamos-content">
        <div className="loan-form-card">
          <h2>Nueva Solicitud</h2>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Monto Solicitado</label>
              <div className="input-group">
                <span className="currency">$</span>
                <input
                  type="number"
                  step="100"
                  min="100"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                  placeholder="0.00"
                />
              </div>
              <small>Mínimo: $100</small>
            </div>

            <div className="form-group">
              <label>Plazo (meses)</label>
              <select value={plazo} onChange={(e) => setPlazo(e.target.value)}>
                <option value="6">6 meses</option>
                <option value="12">12 meses</option>
                <option value="24">24 meses</option>
                <option value="36">36 meses</option>
                <option value="48">48 meses</option>
                <option value="60">60 meses</option>
              </select>
            </div>

            <div className="loan-calculator">
              <h4>Cálculo de Cuota Estimada</h4>
              <div className="calc-row">
                <span>Monto Solicitado:</span>
                <span>${monto || '0.00'}</span>
              </div>
              <div className="calc-row">
                <span>Plazo:</span>
                <span>{plazo} meses</span>
              </div>
              <div className="calc-row">
                <span>Tasa Anual:</span>
                <span>5%</span>
              </div>
              <div className="calc-row highlight">
                <span>Cuota Mensual Estimada:</span>
                <span>${calcularCuota()}</span>
              </div>
            </div>

            <button type="submit" className="btn-request" disabled={loading}>
              {loading ? 'Procesando...' : '📋 Solicitar Préstamo'}
            </button>
          </form>
        </div>

        <div className="loan-info-card">
          <div className="info-section">
            <h3>Ventajas</h3>
            <ul>
              <li>✓ Aprobación en 24 horas</li>
              <li>✓ Tasas desde 5% anual</li>
              <li>✓ Plazo flexible de 6 a 60 meses</li>
              <li>✓ Sin requisitos adicionales</li>
              <li>✓ Desembolso inmediato</li>
            </ul>
          </div>

          {prestamos.length > 0 && (
            <div className="info-section">
              <h3>Mis Solicitudes</h3>
              <div className="loan-list-small">
                {prestamos.slice(0, 3).map((loan) => (
                  <div key={loan._id} className={`loan-badge ${loan.estado}`}>
                    <span className="badge-amount">${loan.montoSolicitado}</span>
                    <span className="badge-status">{loan.estado}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {prestamos.length > 0 && (
        <section className="all-loans-section">
          <h2>Historial de Solicitudes</h2>
          <div className="loan-table">
            <div className="table-header">
              <div className="col">Monto</div>
              <div className="col">Plazo</div>
              <div className="col">Tasa</div>
              <div className="col">Estado</div>
              <div className="col">Fecha</div>
            </div>
            {prestamos.map((loan) => (
              <div key={loan._id} className={`table-row ${loan.estado}`}>
                <div className="col">${loan.montoSolicitado.toFixed(2)}</div>
                <div className="col">{loan.plazo} meses</div>
                <div className="col">{loan.tasaInteres}%</div>
                <div className="col">
                  <span className={`status-badge ${loan.estado}`}>{loan.estado}</span>
                </div>
                <div className="col">
                  {new Date(loan.fechaSolicitud).toLocaleDateString('es-ES')}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
