import React, { useState, useContext } from 'react';
import { transferAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Transferencias.css';

export default function Transferencias() {
  const [cedula, setCedula] = useState('');
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { usuario } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await transferAPI.realizar({
        cedula_destinatario: cedula,
        monto: parseFloat(monto),
        concepto,
      });

      setSuccess(`Transferencia de $${monto} realizada exitosamente`);
      setCedula('');
      setMonto('');
      setConcepto('');

      // Actualizar saldo del usuario
      usuario.saldo -= parseFloat(monto);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error en la transferencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transferencias-container">
      <div className="transferencias-header">
        <h1>Realizar Transferencia</h1>
        <p>Envía dinero a otras cuentas de forma segura</p>
      </div>

      <div className="transferencias-content">
        <div className="transfer-form-card">
          <h2>Nueva Transferencia</h2>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Cédula del Destinatario</label>
              <input
                type="text"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                required
                placeholder="Ingresa la cédula del receptor"
              />
            </div>

            <div className="form-group">
              <label>Monto a Transferir</label>
              <div className="input-group">
                <span className="currency">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Concepto (opcional)</label>
              <input
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej: Pago de servicios"
              />
            </div>

            <div className="form-info">
              <p><strong>Saldo disponible:</strong> ${usuario?.saldo?.toFixed(2) || '0.00'}</p>
            </div>

            <button type="submit" className="btn-transfer" disabled={loading}>
              {loading ? 'Procesando...' : '💸 Realizar Transferencia'}
            </button>
          </form>
        </div>

        <div className="transfer-info-card">
          <h3>Información Importante</h3>
          <ul>
            <li>✓ Las transferencias son inmediatas</li>
            <li>✓ Sin comisiones bancarias</li>
            <li>✓ Totalmente seguras y encriptadas</li>
            <li>✓ Disponible 24/7</li>
            <li>✓ Puedes transferir a cualquier cédula registrada</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
