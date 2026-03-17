// eslint-disable-next-line react-hooks/exhaustive-deps
import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import CryptoForm from '../components/CryptoForm';
import { QRCodeSVG } from 'qrcode.react';
import GooglePayButton from '../components/GooglePayButton';
import axios from 'axios';
import './Recargas.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID;

export default function Deposita() {
  const { usuario } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('tarjeta');
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [codigoDeposito, setCodigoDeposito] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const paypalButtonRef = useRef(null);
  const depositoIdRef = useRef(null);
  // --- FUNCIONES AUXILIARES ---
  const renderButtons = () => {
    if (!window.paypal || !paypalButtonRef.current) return;
    paypalButtonRef.current.innerHTML = '';
    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        height: 45,
      },
      createOrder: async () => {
        try {
          setError('');
          setSuccess('');
          setLoading(true);
          const montoNum = parseFloat(monto);
          if (!monto || isNaN(montoNum) || !isFinite(montoNum) || montoNum <= 0) {
            setError('Debes ingresar un monto válido');
            throw new Error('Monto inválido');
          }
          if (montoNum < 1) {
            setError('El monto mínimo es $1 USD');
            throw new Error('Monto menor al mínimo');
          }
          if (montoNum > 10000) {
            setError('El monto máximo por transacción es $10,000 USD');
            throw new Error('Monto excedido');
          }
          const token = localStorage.getItem('token');
          if (!token) {
            setError('Debes estar autenticado para depositar');
            throw new Error('No autenticado');
          }
          const response = await axios.post(
            `${API_URL}/depositos/crear-paypal`,
            { monto: montoNum },
            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
          );
          const orderId = response.data.orderId;
          depositoIdRef.current = response.data.depositoId;
          if (!orderId || !depositoIdRef.current) {
            setError('No se pudo iniciar el pago. Intenta de nuevo.');
            throw new Error('Orden inválida');
          }
          setLoading(false);
          return orderId;
        } catch (err) {
          setLoading(false);
          setError(`Error al iniciar pago: ${err.message}`);
          throw err;
        }
      },
      onApprove: async (data, actions) => {
        try {
          setLoading(true);
          setSuccess('🔄 Procesando pago...');
          const token = localStorage.getItem('token');
          const headers = token
            ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
            : { 'Content-Type': 'application/json' };
          const response = await axios.post(
            `${API_URL}/depositos/paypal/capturar`,
            { depositoId: depositoIdRef.current, paypalOrderId: data.orderID },
            { headers }
          );
          setSuccess(`✅ ¡Pago completado! Saldo actualizado: $${response.data.nuevoSaldo || 'N/A'}`);
          setMonto('');
          setTimeout(() => window.location.reload(), 3000);
        } catch (err) {
          setLoading(false);
          setError('Error al capturar el pago.');
        }
      },
      onError: (err) => {
        setError(`Error al procesar el pago: ${err.message}`);
        setLoading(false);
      },
      onCancel: (data) => {
        setError('Pago cancelado. No se realizó ningún cargo.');
        setLoading(false);
      },
      onInit: (data, actions) => {},
      onClick: (data, actions) => {
        const montoNum = parseFloat(monto);
        if (!montoNum || montoNum <= 0) {
          setError('Por favor ingresa un monto válido');
          return actions.reject();
        }
        return actions.resolve();
      }
    }).render(paypalButtonRef.current);
  } // <- cierre correcto de renderButtons
  // End of renderButtons
  // (Duplicated) const verificarBackend removed to avoid redeclaration error


  // --- HOOKS ---
  useEffect(() => {
    verificarBackend();
    verificarRetornoPayPal();
  }, []);
  useEffect(() => {
    if (window.paypal) {
      renderButtons();
      return;
    }
    const scriptId = 'paypal-js-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
      script.async = true;
      script.onload = renderButtons;
      document.body.appendChild(script);
    }
  }, [activeTab, monto]);
        

  const verificarRetornoPayPal = async () => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const cancelled = params.get('error');
    const depositoId = params.get('depositoId'); // ID de depósito en BD

    if (cancelled === 'cancelled') {
      setError('Pago cancelado por el usuario.');
      return;
    }

    if (success === 'true' && depositoId) {
      try {
        setLoading(true);
        const authToken = localStorage.getItem('token');
        if (!authToken) {
          setError('Debes estar autenticado para completar el pago.');
          return;
        }

        const response = await axios.post(
          `${API_URL}/depositos/paypal/capturar`,
          { depositoId: depositoId },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        setSuccess('✅ Pago PayPal completado. Saldo actualizado.');
        console.log('✅ Captura PayPal:', response.data);
      } catch (err) {
        console.error('❌ Error capturando PayPal:', err);
        const redirectUrl = err.response?.data?.redirectUrl;
        const action = err.response?.data?.action;
        if (action === 'REDIRECT' && redirectUrl) {
          setSuccess('🔁 Tu pago fue rechazado. Redirigiendo a PayPal para elegir otro metodo...');
          window.location.href = redirectUrl;
          return;
        }
        setError('Error al completar el pago PayPal.');
      } finally {
        setLoading(false);
      }

    }
  }

  const verificarBackend = async () => {
    try {
      const response = await axios.get(`${API_URL}/recargas/debug`);
      console.log('✅ Backend response:', response.data);
      setBackendStatus('ok');
    } catch (err) {
      console.error('❌ Backend error:', err.message);
      setBackendStatus('error');
    }
  };

  const handleCanjearCodigo = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!codigoDeposito || codigoDeposito.trim() === '') {
        setError('Ingresa un código de depósito válido');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/depositos/canjear-codigo`,
        { codigo: codigoDeposito.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`✅ ¡Código canjeado exitosamente! Se agregaron $${response.data.montoAgregado} USD a tu saldo`);
      setCodigoDeposito('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      const mensajeError = err.response?.data?.mensaje || 'Código inválido o ya utilizado';
      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="depositos-container">
      {/* Header */}
      <div className="depositos-header">
        <h1>💰 Deposita tu Saldo</h1>
        <p>Agrega fondos rápido y seguro con tu tarjeta</p>
      </div>

      {/* Tabs */}
      <div className="depositos-tabs">
        <button
          className={`tab-button ${activeTab === 'tarjeta' ? 'active' : ''}`}
          onClick={() => setActiveTab('tarjeta')}
        >
          <span className="tab-logo paypal-mark" aria-hidden="true">P</span>
          <span>Depositar con PayPal</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'googlepay' ? 'active' : ''}`}
          onClick={() => setActiveTab('googlepay')}
        >
          <span className="tab-logo gpay-g" aria-hidden="true">G</span>
          <span>Depositar con Google Pay</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'codigo' ? 'active' : ''}`}
          onClick={() => setActiveTab('codigo')}
        >
          <span className="tab-logo tab-emoji" aria-hidden="true">🎟️</span>
          <span>Usar Código</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'crypto' ? 'active' : ''}`}
          onClick={() => setActiveTab('crypto')}
        >
          <span className="tab-logo tab-emoji" aria-hidden="true">🪙</span>
          <span>Crypto Wallet</span>
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
              <div className="payment-logo paypal-logo" aria-label="PayPal">
                <span className="paypal-mark">P</span>
                <span className="paypal-text">PayPal</span>
              </div>
              <h2>Pago con PayPal</h2>
              <p className="card-subtitle">Paga de forma segura con tu cuenta PayPal</p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="payment-form">
              {/* Input de monto */}
              <div className="form-section">
                <label htmlFor="monto" className="monto-label">¿Cuánto deseas depositar?</label>
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
                      Depositarás: <span className="summary-amount">USD ${parseFloat(monto || 0).toFixed(2)}</span>
                    </p>
                    <p className="summary-info">Sin comisiones adicionales</p>
                  </div>
                )}
              </div>

              {/* Botón de PayPal (JS SDK) */}
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'}}>
                <div className="paypal-buttons" aria-disabled={loading} style={{flex: 1}}>
                  {loading && (
                    <div className="loading-overlay">
                      <div className="spinner"></div>
                      <p>Procesando pago...</p>
                    </div>
                  )}
                  <div ref={paypalButtonRef} />
                </div>
              </div>

              {/* Indicador de estado */}
              {loading && (
                <div className="status-indicator processing">
                  <span className="status-icon">⏳</span>
                  <span>Procesando tu pago...</span>
                </div>
              )}
              {success && !loading && (
                <div className="status-indicator success">
                  <span className="status-icon">✅</span>
                  <span>{success}</span>
                </div>
              )}

              {/* Info de seguridad y métodos */}
            </form>
          </div>
        </div>
      )}

      {/* TAB: Google Pay */}
      {activeTab === 'googlepay' && (
        <div className="payment-container">
          <div className="payment-card">
            <div className="card-title">
              <div className="payment-logo gpay-logo" aria-label="Google Pay">
                <span className="gpay-g">G</span>
                <span className="gpay-text">Google Pay</span>
              </div>
              <h2>Pago con Google Pay</h2>
              <p className="card-subtitle">Paga de forma segura con Google Pay</p>
            </div>
            <form onSubmit={(e) => e.preventDefault()} className="payment-form">
              <div className="form-section">
                <label htmlFor="monto-gpay" className="monto-label">¿Cuánto deseas depositar?</label>
                <div className="monto-input-group">
                  <span className="currency-prefix">USD $</span>
                  <input
                    id="monto-gpay"
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
                      Depositarás: <span className="summary-amount">USD ${parseFloat(monto || 0).toFixed(2)}</span>
                    </p>
                    <p className="summary-info">Sin comisiones adicionales</p>
                  </div>
                )}
              </div>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'}}>
                <div className="gpay-buttons" style={{flex: 1}}>
                  <GooglePayButton monto={monto} />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* TAB: Crypto Wallet */}
      {activeTab === 'crypto' && (
        <div className="payment-container">
          <div className="payment-card">
            <div className="card-title">
              <h2>Recarga con Crypto Wallet</h2>
              <p className="card-subtitle">Recibe depósitos desde cualquier plataforma externa usando tu ID wallet único.</p>
            </div>
            <div className="crypto-wallet-block" style={{textAlign: 'center', margin: '32px 0'}}>
              <div style={{fontWeight: 'bold', fontSize: 18, marginBottom: 8}}>Tu ID Wallet:</div>
              {usuario?.walletId ? (
                <>
                  <div style={{display: 'inline-flex', alignItems: 'center', background: '#f3f3f3', borderRadius: 8, padding: '8px 16px', fontSize: 16, letterSpacing: 1}}>
                    <span id="wallet-id">{usuario.walletId}</span>
                    <button style={{marginLeft: 8, padding: '2px 8px', border: 'none', background: '#1976d2', color: '#fff', borderRadius: 4, cursor: 'pointer'}} onClick={() => {navigator.clipboard.writeText(usuario.walletId)}}>Copiar</button>
                  </div>
                  <div style={{margin: '24px 0'}}>
                    <QRCodeSVG value={usuario.walletId} size={128} />
                    <div style={{fontSize: 13, color: '#888', marginTop: 8}}>Escanea este código QR para transferir a tu wallet desde apps compatibles.</div>
                  </div>
                  <div style={{marginTop: 12, color: '#555', fontSize: 14}}>
                    Usa este ID para recibir transferencias desde Binance, Bybit, u otras plataformas compatibles.
                  </div>
                </>
              ) : (
                <div style={{color: '#b00', fontWeight: 500, marginBottom: 16}}>No tienes una wallet cripto registrada. Solicítala al soporte.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Canjear Código de Depósito */}
      {activeTab === 'codigo' && (
        <div className="payment-container">
          <div className="payment-card">
            <div className="card-title">
              <h2>Canjear Código de Depósito</h2>
              <p className="card-subtitle">¿Tienes un código? Úsalo aquí</p>
            </div>

            <form onSubmit={handleCanjearCodigo} className="payment-form">
              <div className="form-section">
                <label htmlFor="codigo" className="codigo-label">Código de Depósito</label>
                <input
                  id="codigo"
                  type="text"
                  value={codigoDeposito}
                  onChange={(e) => setCodigoDeposito(e.target.value.toUpperCase())}
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
                disabled={loading || !codigoDeposito.trim()}
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
                <h3>ℹ️ Sobre los Códigos de Depósito</h3>
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
      <div className="payment-info">
        <div className="info-section">
          <h3>✅ Métodos de Pago Aceptados</h3>
          <div className="payment-methods">
            <span className="method">🅿️ PayPal</span>
            <span className="method">💳 Tarjeta vinculada a PayPal</span>
            <span className="method">🅶 Google Pay</span>
          </div>
        </div>
        <div className="info-section">
          <h3>🔒 Seguridad Garantizada</h3>
          <ul className="security-list">
            <li>Encriptación SSL de nivel banco</li>
            <li>Procesado por PayPal y Google Pay</li>
            <li>Tu información nunca se almacena en nuestros servidores</li>
            <li>Garantía de reembolso si hay problemas</li>
          </ul>
        </div>
        <div className="info-section">
          <h3>⚡ Proceso Rápido</h3>
          <ul className="process-list">
            <li>1️⃣ Ingresa tu monto</li>
            <li>2️⃣ Haz clic en "Proceder a Pago"</li>
            <li>3️⃣ Completa los datos de tu tarjeta o Google Pay</li>
            <li>4️⃣ ¡Listo! Fondos disponibles instantáneamente</li>
          </ul>
        </div>
        <div className="info-limits">
          <p><strong>Límites de Depósito:</strong></p>
          <p>Mínimo: USD $1.00 | Máximo: USD $10,000.00</p>
        </div>
      </div>
    </div>
  ); // End of Deposita component
}




