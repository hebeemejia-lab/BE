import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { recargaAPI } from '../services/api';
import './Recargas.css';

export default function Recargas() {
  const { usuario, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [monto, setMonto] = useState('');
  // Opciones de pago disponibles (puedes activar/desactivar aquí)
  const opcionesPago = [
    { key: 'stripe', label: 'Tarjeta (Stripe)', activo: true },
    { key: 'paypal', label: 'PayPal', activo: false },
    { key: 'googlepay', label: 'Google Pay', activo: false },
  ];
  const [metodoPago, setMetodoPago] = useState(opcionesPago.find(o => o.activo)?.key || 'stripe');
  const [loadingRecarga, setLoadingRecarga] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  React.useEffect(() => {
    if (!usuario && !loading) {
      navigate('/login');
    }
  }, [usuario, loading, navigate]);

  const handleMontoChange = (e) => {
    setMonto(e.target.value);
  };

  const handleRecargaStripeCheckout = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!monto || parseFloat(monto) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    setLoadingRecarga(true);
    try {
      // Por ahora solo Stripe está activo
      if (metodoPago === 'stripe') {
        const response = await recargaAPI.crearRecargaStripe({ monto: parseFloat(monto) });
        if (response.data && response.data.url) {
          window.location.href = response.data.url; // Redirect to Stripe Checkout
        } else {
          setError('No se pudo obtener la URL de pago.');
        }
      } else {
        setError('Método de pago aún no disponible.');
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error creando sesión de pago');
    } finally {
      setLoadingRecarga(false);
    }
  };

  return (
    <div className="recargas-container">
      <div className="recargas-card">
        <div className="card-header">
          <h2>Recargar Saldo</h2>
          <p>Agrega dinero a tu cuenta</p>
        </div>
        <div className="saldo-actual">
          <span>Saldo disponible:</span>
          <h3>${parseFloat(usuario?.saldo || 0).toFixed(2)}</h3>
        </div>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleRecargaStripeCheckout} className="form-section">
          <div className="form-group">
            <label>Método de pago</label>
            <div className="metodo-pago-selector">
              {opcionesPago.map(opcion => (
                <label key={opcion.key} style={{ opacity: opcion.activo ? 1 : 0.5 }}>
                  <input
                    type="radio"
                    name="metodoPago"
                    value={opcion.key}
                    checked={metodoPago === opcion.key}
                    onChange={() => setMetodoPago(opcion.key)}
                    disabled={!opcion.activo}
                  />
                  <span>{opcion.label}{!opcion.activo && ' (próximamente)'}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Monto a recargar ($)</label>
            <div className="monto-selector">
              {[10, 20, 50, 100, 200, 500].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`monto-btn ${monto === m.toString() ? 'selected' : ''}`}
                  onClick={() => setMonto(m.toString())}
                >
                  ${m}
                </button>
              ))}
            </div>
            <input
              type="number"
              name="monto"
              value={monto}
              onChange={handleMontoChange}
              placeholder="Otro monto"
              step="0.01"
              min="1"
              className="custom-monto"
            />
          </div>
          <div className="info-box">
            <h4>🔒 Información Segura</h4>
            <ul>
              <li>✓ Procesamiento seguro con Stripe, PayPal y Google Pay</li>
              <li>✓ Datos encriptados con SSL/TLS</li>
              <li>✓ Cumplimiento PCI DSS</li>
            </ul>
          </div>
          <button
            type="submit"
            disabled={loadingRecarga || !monto}
            className="btn-submit"
          >
            {loadingRecarga ? 'Redirigiendo...' : `Recargar $${parseFloat(monto || 0).toFixed(2)} con Stripe, PayPal o Google Pay`}
          </button>
        </form>
      </div>
    </div>
  );
}
