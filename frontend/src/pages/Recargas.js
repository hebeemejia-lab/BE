import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Recargas.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Recargas() {
  const [activeTab, setActiveTab] = useState('tarjeta');
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

  const handlePagoTarjeta = async (e) => {
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

      console.log('📤 Enviando solicitud de pago a:', `${API_URL}/recargas/crear-rapyd`);
      console.log('📋 Configuración API_URL:', API_URL);
      console.log('📋 Token presente:', !!token);
      
      const response = await axios.post(
        `${API_URL}/recargas/crear-rapyd`,
        { monto: montoNum },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('✅ Respuesta del servidor:', response.data);

      // Verificar si hay URL de checkout
      if (response.data.checkoutUrl) {
        setSuccess('✅ Redirigiendo a formulario de pago seguro...');
        setTimeout(() => {
          window.location.href = response.data.checkoutUrl;
        }, 1500);
      } else {
        setError('El servidor no proporcionó URL de pago. Intenta de nuevo.');
      }
    } catch (err) {
      console.error('❌ Error completo:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error data:', err.response?.data);
      
      let mensajeError = 'Error al crear la recarga';
      
      if (err.response?.status === 404) {
        mensajeError = '❌ Error 404: El endpoint no existe. Verifica que el backend esté corriendo y la URL sea correcta.';
        console.error('🔍 URL intentada:', `${API_URL}/recargas/crear-rapyd`);
      } else if (err.response?.data?.mensaje) {
        mensajeError = err.response.data.mensaje;
      } else if (err.response?.data?.error) {
        mensajeError = err.response.data.error;
      } else if (err.message) {
        mensajeError = err.message;
      }
      
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

  return (
    <div className="recargas-container">
      {/* Header */}
      <div className="recargas-header">
        <h1>💰 Recargar tu Saldo</h1>
        <p>Agrega fondos rápido y seguro con tu tarjeta</p>
      </div>

      {/* Tabs */}
      <div className="recargas-tabs">
        <button
          className={`tab-button ${activeTab === 'tarjeta' ? 'active' : ''}`}
          onClick={() => setActiveTab('tarjeta')}
        >
          💳 Pagar con Tarjeta
        </button>
        <button
          className={`tab-button ${activeTab === 'codigo' ? 'active' : ''}`}
          onClick={() => setActiveTab('codigo')}
        >
          🎟️ Usar Código
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

      {/* TAB: Tarjeta de Crédito */}
      {activeTab === 'tarjeta' && (
        <div className="payment-container">
          <div className="payment-card">
            <div className="card-title">
              <h2>Pago con Tarjeta de Crédito o Débito</h2>
              <p className="card-subtitle">Visa, Mastercard y más tarjetas internacionales</p>
            </div>

            <form onSubmit={handlePagoTarjeta} className="payment-form">
              {/* Input de monto */}
              <div className="form-section">
                <label htmlFor="monto" className="monto-label">¿Cuánto deseas recargar?</label>
                <div className="monto-input-group">
                  <span className="currency-prefix">USD $</span>
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
                    className="monto-input"
                  />
                </div>
                {monto && (
                  <div className="monto-summary">
                    <p className="summary-text">
                      Pagarás: <span className="summary-amount">USD ${parseFloat(monto || 0).toFixed(2)}</span>
                    </p>
                    <p className="summary-info">Sin comisiones adicionales</p>
                  </div>
                )}
              </div>

              {/* Botón de pago */}
              <button
                type="submit"
                className="btn-payment"
                disabled={loading || !monto || parseFloat(monto) <= 0}
              >
                {loading ? (
                  <>
                    <span className="spinner">⏳</span>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>🔐</span>
                    <span>Proceder a Pago Seguro</span>
                  </>
                )}
              </button>

              {/* Info de seguridad y métodos */}
              <div className="payment-info">
                <div className="info-section">
                  <h3>✅ Métodos de Pago Aceptados</h3>
                  <div className="payment-methods">
                    <span className="method">💳 Visa</span>
                    <span className="method">💳 Mastercard</span>
                    <span className="method">💳 American Express</span>
                    <span className="method">💳 Diners Club</span>
                    <span className="method">🌐 Wallets Internacionales</span>
                  </div>
                </div>

                <div className="info-section">
                  <h3>🔒 Seguridad Garantizada</h3>
                  <ul className="security-list">
                    <li>Encriptación SSL de nivel banco</li>
                    <li>Procesado por Rapyd (Plataforma Internacional Certificada)</li>
                    <li>Tu información nunca se almacena en nuestros servidores</li>
                    <li>Garantía de reembolso si hay problemas</li>
                  </ul>
                </div>

                <div className="info-section">
                  <h3>⚡ Proceso Rápido</h3>
                  <ul className="process-list">
                    <li>1️⃣ Ingresa tu monto</li>
                    <li>2️⃣ Haz clic en "Proceder a Pago"</li>
                    <li>3️⃣ Completa los datos de tu tarjeta</li>
                    <li>4️⃣ ¡Listo! Fondos disponibles instantáneamente</li>
                  </ul>
                </div>

                <div className="info-limits">
                  <p><strong>Límites de Recarga:</strong></p>
                  <p>Mínimo: USD $1.00 | Máximo: USD $10,000.00</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: Código */}
      {activeTab === 'codigo' && (
        <div className="payment-container">
          <div className="payment-card">
            <div className="card-title">
              <h2>Canjear Código de Recarga</h2>
              <p className="card-subtitle">¿Tienes un código? Úsalo aquí</p>
            </div>

            <form onSubmit={handleCanjearCodigo} className="payment-form">
              <div className="form-section">
                <label htmlFor="codigo" className="codigo-label">Código de Recarga</label>
                <input
                  id="codigo"
                  type="text"
                  value={codigoRecarga}
                  onChange={(e) => setCodigoRecarga(e.target.value.toUpperCase())}
                  placeholder="Ej: ABC12-XYZ34-DEF56-GHI78"
                  maxLength="30"
                  required
                  className="codigo-input"
                />
                <p className="codigo-hint">Formato típico: XXXX-XXXX-XXXX-XXXX</p>
              </div>

              <button
                type="submit"
                className="btn-payment"
                disabled={loading || !codigoRecarga.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner">⏳</span>
                    <span>Canjeando...</span>
                  </>
                ) : (
                  <>
                    <span>🎁</span>
                    <span>Canjear Código</span>
                  </>
                )}
              </button>

              <div className="codigo-info">
                <h3>ℹ️ Sobre los Códigos de Recarga</h3>
                <ul>
                  <li>📦 Los códigos son de un solo uso</li>
                  <li>♾️ Sin fecha de expiración</li>
                  <li>🎁 Perfectos para regalar</li>
                  <li>⚡ Se canjean al instante</li>
                  <li>💰 Valores variados disponibles</li>
                </ul>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
    </div>
  );
}

