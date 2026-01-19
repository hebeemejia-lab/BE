import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { bankAccountAPI } from '../services/api';
import './Retiros.css';

export default function Retiros() {
  const { usuario } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    monto: '',
    moneda: 'USD', // USD, DOP, EUR
    cuentaId: '',
  });
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cuentasLoading, setCuentasLoading] = useState(true);

  // Cargar cuentas vinculadas al montar
  React.useEffect(() => {
    cargarCuentas();
  }, []);

  const cargarCuentas = async () => {
    try {
      setCuentasLoading(true);
      const response = await bankAccountAPI.listarCuentas();
      setCuentas(response.data);
      
      // Seleccionar la cuenta por defecto
      const cuentaDefault = response.data.find(c => c.esDefault);
      if (cuentaDefault) {
        setFormData(prev => ({ ...prev, cuentaId: cuentaDefault.id }));
      }
    } catch (err) {
      console.error('Error cargando cuentas:', err);
      setError('No se pudieron cargar las cuentas vinculadas');
    } finally {
      setCuentasLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validarFormulario = () => {
    const monto = parseFloat(formData.monto);
    
    if (!formData.monto || monto <= 0) {
      setError('Ingresa un monto válido');
      return false;
    }

    if (monto > parseFloat(usuario?.saldo || 0)) {
      setError('Saldo insuficiente para este retiro');
      return false;
    }

    if (!formData.cuentaId) {
      setError('Selecciona una cuenta bancaria');
      return false;
    }

    const cuenta = cuentas.find(c => c.id === parseInt(formData.cuentaId));
    if (!cuenta || cuenta.estado !== 'verificada') {
      setError('La cuenta seleccionada no está verificada');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validarFormulario()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/retiros/procesar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          monto: parseFloat(formData.monto),
          moneda: formData.moneda,
          cuentaId: parseInt(formData.cuentaId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error procesando retiro');
      }

      setSuccess(`✓ Retiro exitoso. -$${formData.monto} ${formData.moneda}. Ref: ${data.numeroReferencia}`);
      setFormData({
        monto: '',
        moneda: 'USD',
        cuentaId: formData.cuentaId,
      });
    } catch (err) {
      setError(err.message || 'Error procesando el retiro');
    } finally {
      setLoading(false);
    }
  };

  const monedas = [
    { codigo: 'USD', simbolo: '$', nombre: 'Dólar Estadounidense' },
    { codigo: 'DOP', simbolo: 'RD$', nombre: 'Peso Dominicano' },
    { codigo: 'EUR', simbolo: '€', nombre: 'Euro' },
  ];

  const monedaSeleccionada = monedas.find(m => m.codigo === formData.moneda);

  if (cuentasLoading) {
    return (
      <div className="retiros-container">
        <div className="retiros-card">
          <div className="loading-spinner">Cargando cuentas...</div>
        </div>
      </div>
    );
  }

  if (cuentas.length === 0) {
    return (
      <div className="retiros-container">
        <div className="retiros-card">
          <div className="card-header">
            <h2>💳 Retirar Dinero</h2>
            <p>Transfiere fondos a tu cuenta bancaria</p>
          </div>
          <div className="empty-state">
            <p>📌 No tienes cuentas bancarias vinculadas</p>
            <p>Para retirar dinero, primero debes:</p>
            <ol>
              <li>Ir a <strong>Cuentas Bancarias</strong></li>
              <li>Vincular una cuenta</li>
              <li>Verificarla con microdeposits</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="retiros-container">
      <div className="retiros-card">
        <div className="card-header">
          <h2>💳 Retirar Dinero</h2>
          <p>Transfiere fondos a tu cuenta bancaria</p>
        </div>

        <div className="saldo-actual">
          <span>Saldo disponible:</span>
          <h3>${parseFloat(usuario?.saldo || 0).toFixed(2)}</h3>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="form-section">
          {/* Monto */}
          <div className="form-group">
            <label>Monto a retirar</label>
            <div className="monto-input-group">
              <span className="currency-symbol">{monedaSeleccionada?.simbolo}</span>
              <input
                type="number"
                name="monto"
                value={formData.monto}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                max={parseFloat(usuario?.saldo || 0)}
              />
            </div>
            <div className="monto-presets">
              {[50, 100, 200, 500, 1000].map((monto) => (
                <button
                  key={monto}
                  type="button"
                  className={`monto-btn ${formData.monto === monto.toString() ? 'selected' : ''}`}
                  onClick={() => {
                    if (monto <= parseFloat(usuario?.saldo || 0)) {
                      setFormData({ ...formData, monto: monto.toString() });
                    }
                  }}
                >
                  {monedaSeleccionada?.simbolo}{monto}
                </button>
              ))}
            </div>
          </div>

          {/* Moneda */}
          <div className="form-group">
            <label>Moneda</label>
            <div className="moneda-selector">
              {monedas.map((m) => (
                <label key={m.codigo} className="moneda-option">
                  <input
                    type="radio"
                    name="moneda"
                    value={m.codigo}
                    checked={formData.moneda === m.codigo}
                    onChange={handleChange}
                  />
                  <span className="moneda-label">
                    <strong>{m.simbolo} {m.codigo}</strong>
                    <small>{m.nombre}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Cuenta Bancaria */}
          <div className="form-group">
            <label>Cuenta de Destino</label>
            <select
              name="cuentaId"
              value={formData.cuentaId}
              onChange={handleChange}
              required
            >
              <option value="">-- Selecciona una cuenta --</option>
              {cuentas.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.nombreCuenta} ({cuenta.banco}) - ****{cuenta.numerosCuenta}
                  {cuenta.esDefault && ' (Por defecto)'}
                  {cuenta.estado !== 'verificada' && ' - No verificada'}
                </option>
              ))}
            </select>
            <small className="help-text">
              Solo puedes retirar a cuentas verificadas
            </small>
          </div>

          {/* Información */}
          <div className="info-box">
            <h4>ℹ️ Información de Retiro</h4>
            <ul>
              <li>✓ Transferencia a 1-2 días hábiles</li>
              <li>✓ Sin comisión de retiro</li>
              <li>✓ Monto máximo: ${parseFloat(usuario?.saldo || 0).toFixed(2)}</li>
              <li>✓ Número de referencia para seguimiento</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.monto || !formData.cuentaId}
            className="btn-submit"
          >
            {loading ? 'Procesando...' : `Retirar ${monedaSeleccionada?.simbolo}${parseFloat(formData.monto || 0).toFixed(2)}`}
          </button>
        </form>
      </div>

      {/* Historial */}
      <div className="historial-card">
        <h3>Últimos Retiros</h3>
        <div className="historial-tabla">
          <table>
            <thead>
              <tr>
                <th>Monto</th>
                <th>Moneda</th>
                <th>Cuenta</th>
                <th>Estado</th>
                <th>Referencia</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
