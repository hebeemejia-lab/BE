import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Recargas.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Recargas() {
  const [activeTab, setActiveTab] = useState('rapyd');
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [codigoRecarga, setCodigoRecarga] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');

  // Verificar estado del backend al cargar
  useEffect(() => {
    verificarBackend();
  }, []);

  const verificarBackend = async () => {
    try {
      const response = await axios.get(`${API_URL}/recargas/test`);
      console.log('✅ Backend response:', response.data);
      setBackendStatus('ok');
    } catch (err) {
      console.error('❌ Backend error:', err.message);
      setBackendStatus('error');
    }
  };

  const handleRecargaRapyd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validar monto
      const montoNum = parseFloat(monto);
      if (!montoNum || montoNum <= 0 || montoNum < 1) {
        setError('El monto debe ser mayor a $1 USD');
        setLoading(false);
        return;
      }

      if (montoNum > 10000) {
        setError('El monto máximo por transacción es $10,000 USD');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Debes estar autenticado para recargar');
        setLoading(false);
        return;
      }

      console.log('📤 Enviando solicitud de recarga a:', `${API_URL}/recargas/crear-rapyd`);
      
      const response = await axios.post(
        `${API_URL}/recargas/crear-rapyd`,
        { monto: montoNum },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Respuesta del servidor:', response.data);

      // Verificar si hay URL de checkout
      if (response.data.checkoutUrl) {
        setSuccess('✅ Redirigiendo a página de pago segura...');
        setTimeout(() => {
          window.location.href = response.data.checkoutUrl;
        }, 1500);
      } else {
        setError('El servidor no proporcionó URL de pago. Intenta de nuevo.');
      }
    } catch (err) {
      console.error('❌ Error completo:', err);
      const mensajeError = 
        err.response?.data?.mensaje || 
        err.response?.data?.error ||
        err.message ||
        'Error al crear la recarga';
      setError(`Error: ${mensajeError}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCanjearCodigo = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!codigoRecarga || codigoRecarga.trim() === '') {
        setError('Ingresa un código de recarga válido');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/recargas/canjear-codigo`,
        { codigo: codigoRecarga.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`✅ ¡Código canjeado exitosamente! Se agregaron $${response.data.montoAgregado} USD a tu saldo`);
      setCodigoRecarga('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      const mensajeError = err.response?.data?.mensaje || 'Código inválido o ya utilizado';
      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  const montos = [
    { valor: 10, label: '$10 USD' },
    { valor: 25, label: '$25 USD' },
    { valor: 50, label: '$50 USD' },
    { valor: 100, label: '$100 USD' },
    { valor: 250, label: '$250 USD' },
    { valor: 500, label: '$500 USD' },
  ];

  return (
    <div className="recargas-container">
      {/* Header */}
      <div className="recargas-header">
        <h1>💰 Recargar Saldo</h1>
        <p>Agrega fondos a tu cuenta de forma segura</p>
      </div>

      {/* Tabs */}
      <div className="recargas-tabs">
        <button
          className={`tab-button ${activeTab === 'rapyd' ? 'active' : ''}`}
          onClick={() => setActiveTab('rapyd')}
        >
          💳 Tarjeta de Crédito/Débito
        </button>
        <button
          className={`tab-button ${activeTab === 'codigo' ? 'active' : ''}`}
          onClick={() => setActiveTab('codigo')}
        >
          🎟️ Código de Recarga
        </button>
      </div>

      {/* Mensajes de error y éxito */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
          <button className="alert-close" onClick={() => setError('')}>✕</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
          <button className="alert-close" onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {/* Estado del backend */}
      {backendStatus === 'error' && (
        <div className="alert alert-warning">
          ⚠️ El servidor está actualizando. Por favor intenta de nuevo en unos momentos.
        </div>
      )}

      {/* TAB: Rapyd */}
      {activeTab === 'rapyd' && (
        <div className="recarga-form-container">
          <div className="recarga-form-card">
            <div className="card-header">
              <h2>💳 Recarga Rápida y Segura</h2>
              <span className="badge-secure">🔒 Pago Seguro</span>
            </div>

            <div className="currency-badge">
              💵 USD (Dólares Estadounidenses)
            </div>

            <form onSubmit={handleRecargaRapyd}>
              {/* Input de monto */}
              <div className="form-group">
                <label htmlFor="monto">Monto a Recargar *</label>
                <div className="input-wrapper">
                  <span className="currency-symbol">$</span>
                  <input
                    id="monto"
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="1"
                    max="10000"
                    required
                  />
                  <span className="currency-code">USD</span>
                </div>
                {monto && (
                  <small className="monto-info">
                    Monto: ${parseFloat(monto || 0).toFixed(2)} USD
                  </small>
                )}
              </div>

              {/* Botones de montos rápidos */}
              <div className="quick-amounts">
                <p className="quick-label">O elige un monto rápido:</p>
                <div className="amount-grid">
                  {montos.map((m) => (
                    <button
                      key={m.valor}
                      type="button"
                      className={`amount-btn ${monto === m.valor.toString() ? 'active' : ''}`}
                      onClick={() => setMonto(m.valor.toString())}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón de submit */}
              <button
                type="submit"
                className="btn-recarga-submit"
                disabled={loading || !monto || parseFloat(monto) <= 0}
              >
                {loading ? (
                  <>
                    <span className="spinner">⏳</span> Procesando...
                  </>
                ) : (
                  <>
                    <span>🔐</span> Proceder al Pago
                  </>
                )}
              </button>
            </form>

            {/* Información de seguridad */}
            <div className="security-info">
              <h3>✅ Información de Seguridad</h3>
              <ul>
                <li>🔒 Pagos 100% seguros con Rapyd</li>
                <li>💳 Aceptamos todas las tarjetas principales</li>
                <li>⚡ Fondos disponibles instantáneamente</li>
                <li>🌍 Soporte en múltiples países</li>
                <li>💰 Monto mínimo: $1 USD | Máximo: $10,000 USD</li>
              </ul>
            </div>
          </div>

          {/* Card info adicional */}
          <div className="recarga-info-panel">
            <h3>¿Preguntas sobre la recarga?</h3>
            <div className="faq-item">
              <p><strong>¿Cuánto tiempo tarda?</strong></p>
              <p>Los fondos se agregan instantáneamente después de completar el pago.</p>
            </div>
            <div className="faq-item">
              <p><strong>¿Cuál es la comisión?</strong></p>
              <p>No hay comisiones adicionales. Pagas solo el monto que ingresas.</p>
            </div>
            <div className="faq-item">
              <p><strong>¿Es seguro?</strong></p>
              <p>Usamos Rapyd, un procesador de pagos internacional certificado.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Código */}
      {activeTab === 'codigo' && (
        <div className="recarga-form-container">
          <div className="recarga-form-card">
            <div className="card-header">
              <h2>🎟️ Canjear Código de Recarga</h2>
            </div>

            <p className="form-description">
              Si ya tienes un código de recarga, úsalo aquí para agregar saldo instantáneamente.
            </p>

            <form onSubmit={handleCanjearCodigo}>
              <div className="form-group">
                <label htmlFor="codigo">Código de Recarga *</label>
                <input
                  id="codigo"
                  type="text"
                  value={codigoRecarga}
                  onChange={(e) => setCodigoRecarga(e.target.value.toUpperCase())}
                  placeholder="Ej: ABC12-XYZ34-DEF56-GHI78"
                  maxLength="30"
                  required
                />
                <small>Formato típico: XXXX-XXXX-XXXX-XXXX</small>
              </div>

              <button
                type="submit"
                className="btn-recarga-submit"
                disabled={loading || !codigoRecarga.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner">⏳</span> Canjeando...
                  </>
                ) : (
                  <>
                    <span>🎁</span> Canjear Código
                  </>
                )}
              </button>
            </form>

            <div className="codigo-info">
              <h3>ℹ️ Sobre los Códigos de Recarga</h3>
              <ul>
                <li>📦 Los códigos son de un solo uso</li>
                <li>♾️ Sin fecha de expiración</li>
                <li>🎁 Perfectos para regalar</li>
                <li>⚡ Canjeables al instante</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
