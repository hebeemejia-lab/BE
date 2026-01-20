import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { recargaAPI } from '../services/api';
import './Recargas.css';

export default function Recargas() {
  const { usuario, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [monto, setMonto] = useState('');
  const [sugerencias, setSugerencias] = useState([10, 20, 50, 100, 200, 500]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const inputRef = useRef(null);
  // Opciones de pago disponibles (puedes activar/desactivar aquí)
  // Solo mostrar pago con tarjeta (Stripe)
  const opcionesPago = [
    { key: 'stripe', label: 'Tarjeta (Visa/Mastercard)', activo: true }
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
    setMostrarSugerencias(true);
  };

  const handleSugerenciaClick = (valor) => {
    setMonto(valor.toString());
    setMostrarSugerencias(false);
    inputRef.current?.focus();
  };

  // Botón general para iniciar recarga según método
  const handleRecarga = async (metodo) => {
    setError('');
    setSuccess('');
    if (!monto || parseFloat(monto) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    setLoadingRecarga(true);
    try {
      if (metodo === 'stripe') {
        const response = await recargaAPI.crearRecargaStripe({ monto: parseFloat(monto) });
        if (response.data && response.data.url) {
          window.location.href = response.data.url;
        } else {
          setError('No se pudo obtener la URL de pago.');
        }
      } else if (metodo === 'paypal') {
        setError('PayPal estará disponible próximamente.');
      } else if (metodo === 'googlepay') {
        setError('Google Pay estará disponible próximamente.');
      } else {
        setError('Método de pago no soportado.');
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
        <form className="form-section" onSubmit={e => e.preventDefault()} autoComplete="on">
          <div className="form-group">
            <label>Método de pago</label>
            <div className="metodo-pago-selector">
              <button
                type="button"
                className={`btn-metodo selected`}
                disabled={loadingRecarga}
                style={{ marginRight: 8 }}
                onClick={() => setMetodoPago('stripe')}
              >
                Tarjeta (Visa/Mastercard)
              </button>
            </div>
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Monto a recargar ($)</label>
            <input
              ref={inputRef}
              type="number"
              name="monto"
              value={monto}
              onChange={handleMontoChange}
              placeholder="Ingresa el monto"
              step="0.01"
              min="1"
              className="custom-monto"
              autoComplete="on"
              onFocus={() => setMostrarSugerencias(true)}
              onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
            />
            {mostrarSugerencias && (
              <ul className="sugerencias-lista">
                {sugerencias.filter(s => s.toString().startsWith(monto) || monto === '').map(s => (
                  <li
                    key={s}
                    className="sugerencia-item"
                    onMouseDown={() => handleSugerenciaClick(s)}
                  >
                    ${s}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="info-box">
            <h4>🔒 Información Segura</h4>
            <ul>
              <li>✓ Procesamiento seguro con Stripe</li>
              <li>✓ Datos encriptados con SSL/TLS</li>
              <li>✓ Cumplimiento PCI DSS</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: '1em', marginTop: 16 }}>
            <button
              type="button"
              className="btn-submit"
              disabled={loadingRecarga || !monto}
              onClick={() => handleRecarga('stripe')}
            >
              {loadingRecarga ? 'Redirigiendo...' : `Pagar con Tarjeta`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
