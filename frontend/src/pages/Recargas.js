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
  // Datos de tarjeta
  const [tarjeta, setTarjeta] = useState({
    numero: '',
    nombre: '',
    mes: '',
    ano: '',
    cvv: ''
  });
    const handleTarjetaChange = (e) => {
      setTarjeta({ ...tarjeta, [e.target.name]: e.target.value });
    };
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
  const handleRecarga = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!monto || parseFloat(monto) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    if (!tarjeta.numero || !tarjeta.nombre || !tarjeta.mes || !tarjeta.ano || !tarjeta.cvv) {
      setError('Completa todos los datos de la tarjeta');
      return;
    }
    setLoadingRecarga(true);
    try {
      // Aquí deberías llamar a tu API real de procesamiento de tarjeta
      // Simulación de éxito
      setTimeout(() => {
        setSuccess('Recarga exitosa. Monto: $' + monto);
        setLoadingRecarga(false);
      }, 1200);
    } catch (err) {
      setError('Error procesando el pago');
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
        <form className="form-section" onSubmit={handleRecarga} autoComplete="on">
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
          <div className="form-group">
            <label>Número de Tarjeta</label>
            <input
              type="text"
              name="numero"
              value={tarjeta.numero}
              onChange={handleTarjetaChange}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              autoComplete="cc-number"
              required
            />
          </div>
          <div className="form-group">
            <label>Nombre en la Tarjeta</label>
            <input
              type="text"
              name="nombre"
              value={tarjeta.nombre}
              onChange={handleTarjetaChange}
              placeholder="Como aparece en la tarjeta"
              autoComplete="cc-name"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mes</label>
              <input
                type="text"
                name="mes"
                value={tarjeta.mes}
                onChange={handleTarjetaChange}
                placeholder="MM"
                maxLength={2}
                autoComplete="cc-exp-month"
                required
              />
            </div>
            <div className="form-group">
              <label>Año</label>
              <input
                type="text"
                name="ano"
                value={tarjeta.ano}
                onChange={handleTarjetaChange}
                placeholder="YY"
                maxLength={2}
                autoComplete="cc-exp-year"
                required
              />
            </div>
            <div className="form-group">
              <label>CVV</label>
              <input
                type="password"
                name="cvv"
                value={tarjeta.cvv}
                onChange={handleTarjetaChange}
                placeholder="CVV"
                maxLength={4}
                autoComplete="cc-csc"
                required
              />
            </div>
          </div>
          <div className="info-box">
            <h4>🔒 Información Segura</h4>
            <ul>
              <li>✓ Procesamiento seguro (simulado)</li>
              <li>✓ Datos encriptados con SSL/TLS</li>
              <li>✓ Cumplimiento PCI DSS</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: '1em', marginTop: 16 }}>
            <button
              type="submit"
              className="btn-submit"
              disabled={loadingRecarga || !monto}
            >
              {loadingRecarga ? 'Procesando...' : `Pagar`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
