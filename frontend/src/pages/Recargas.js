import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Recargas.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID;

export default function Recargas() {
  const [activeTab, setActiveTab] = useState('tarjeta');
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [codigoRecarga, setCodigoRecarga] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const paypalButtonRef = useRef(null);
  const recargaIdRef = useRef(null);
  const [googlePayStep, setGooglePayStep] = useState('start');
  const [googlePayCard, setGooglePayCard] = useState('visa-4242');
  const [googlePayAddress, setGooglePayAddress] = useState('home');

  // Verificar estado del backend al cargar
  useEffect(() => {
    verificarBackend();
    verificarRetornoPayPal();
  }, []);

  useEffect(() => {
    if (activeTab !== 'tarjeta') return;
    if (!PAYPAL_CLIENT_ID) {
      setError('Falta configurar PAYPAL_CLIENT_ID en el frontend.');
      return;
    }

    const renderButtons = () => {
      if (!window.paypal || !paypalButtonRef.current) return;

      paypalButtonRef.current.innerHTML = '';

      window.paypal.Buttons({
        // ESTILO Y APARIENCIA
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 45,
        },
        
        // CREAR ORDEN
        createOrder: async () => {
          try {
            setError('');
            setSuccess('');
            setLoading(true);

            console.log('🔍 Frontend - Monto ingresado:', monto, 'Tipo:', typeof monto);

            const montoNum = parseFloat(monto);
            console.log('🔍 Frontend - Monto parseado:', montoNum, 'Tipo:', typeof montoNum);
            
            // Validaciones estrictas de monto
            if (!monto || monto === '' || monto === null || monto === undefined) {
              setError('Debes ingresar un monto');
              throw new Error('Monto vacío');
            }

            if (isNaN(montoNum) || !isFinite(montoNum)) {
              setError('El monto ingresado no es válido');
              throw new Error('Monto inválido');
            }

            if (montoNum <= 0) {
              setError('El monto debe ser mayor a $0');
              throw new Error('Monto debe ser positivo');
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
              setError('Debes estar autenticado para recargar');
              throw new Error('No autenticado');
            }

            console.log('🔄 Creando orden PayPal para $', montoNum);
            console.log('📤 Enviando al backend:', { monto: montoNum });

            const response = await axios.post(
              `${API_URL}/recargas/crear-paypal`,
              { monto: montoNum },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            console.log('✅ Respuesta del backend:', response.data);

            const orderId = response.data.orderId;
            recargaIdRef.current = response.data.recargaId;

            if (!orderId || !recargaIdRef.current) {
              setError('No se pudo iniciar el pago. Intenta de nuevo.');
              throw new Error('Orden inválida');
            }

            console.log('✅ Orden creada:', orderId);
            
            // Analytics: seguimiento de inicio de conversión
            if (window.gtag) {
              window.gtag('event', 'begin_checkout', {
                currency: 'USD',
                value: montoNum,
                items: [{ id: orderId, name: 'Recarga PayPal', price: montoNum }]
              });
            }

            setLoading(false);
            return orderId;
          } catch (err) {
            setLoading(false);
            console.error('❌ Error creando orden:', err);
            console.error('📋 Detalles de error:', err.response?.data);
            const errorMsg = err.response?.data?.mensaje || err.response?.data?.error || err.message || 'Error desconocido';
            setError(`Error al iniciar pago: ${errorMsg}`);
            throw err;
          }
        },
        
        // APROBAR PAGO
        onApprove: async (data, actions) => {
          try {
            setLoading(true);
            setSuccess('🔄 Procesando pago...');
            
            console.log('🔄 Capturando pago PayPal:', data.orderID);
            console.log('   recargaIdRef.current:', recargaIdRef.current);
            console.log('   Enviando al backend:', { 
              recargaId: recargaIdRef.current,
              paypalOrderId: data.orderID
            });
            
            const token = localStorage.getItem('token');
            const headers = token
              ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
              : { 'Content-Type': 'application/json' };

            const response = await axios.post(
              `${API_URL}/recargas/paypal/capturar`,
              { 
                recargaId: recargaIdRef.current,
                paypalOrderId: data.orderID 
              },
              { headers }
            );

            console.log('✅ Pago capturado:', response.data);
            
            setSuccess(`✅ ¡Pago completado! Saldo actualizado: $${response.data.nuevoSaldo || 'N/A'}`);
            setMonto('');
            
            // Analytics: seguimiento de conversión exitosa
            if (window.gtag) {
              window.gtag('event', 'purchase', {
                transaction_id: data.orderID,
                currency: 'USD',
                value: response.data.monto || 0,
                items: [{ id: data.orderID, name: 'Recarga PayPal', price: response.data.monto }]
              });
            }
            
            // Recargar página después de 3 segundos para actualizar saldo
            setTimeout(() => window.location.reload(), 3000);
          } catch (err) {
            console.error('❌ Error capturando PayPal:', err);
            console.error('   Respuesta del servidor:', err.response?.data);
            const redirectUrl = err.response?.data?.redirectUrl;
            const action = err.response?.data?.action;
            if (action === 'REDIRECT' && redirectUrl) {
              setSuccess('🔁 Tu pago fue rechazado. Redirigiendo a PayPal para elegir otro metodo...');
              window.location.href = redirectUrl;
              return;
            }
            const errorMsg = err.response?.data?.mensaje || err.message || 'Error desconocido';
            const detalles = err.response?.data?.detalles;
            const debugId = err.response?.data?.debug_id || 'N/A';
            const issue = detalles?.details?.[0]?.issue;
            const mensajeUsuarioBackend = err.response?.data?.mensajeUsuario;
            const sugerencias = err.response?.data?.sugerencias || [];
            
            // Usar mensaje del backend si está disponible, sino construir uno
            let mensajeUsuario = mensajeUsuarioBackend || errorMsg;
            
            // Si no hay mensaje del backend, construir basado en el error
            if (!mensajeUsuarioBackend) {
              if (issue === 'INSTRUMENT_DECLINED') {
                mensajeUsuario = '❌ Tu tarjeta fue rechazada.\n\nVerifica:\n• Que tenga fondos suficientes\n• Que no esté bloqueada\n• Intenta con otra tarjeta o cuenta bancaria';
              } else if (detalles?.name === 'UNPROCESSABLE_ENTITY') {
                mensajeUsuario = '❌ Error procesando el pago.\n\nIntenta:\n• Con otro método de pago en PayPal\n• En unos minutos\n• Contacta a tu banco';
              }
            }
            
            // Agregar sugerencias si las hay
            if (sugerencias && sugerencias.length > 0) {
              mensajeUsuario += '\n\n💡 Sugerencias:\n• ' + sugerencias.join('\n• ');
            }
            
            setError(mensajeUsuario);
            
            // Log detallado para debugging
            console.log('🔍 Detalles del error:');
            console.log('   Issue:', issue);
            console.log('   Error Code:', detalles?.name);
            console.log('   Debug ID:', debugId);
            console.log('   Mensaje usuario:', mensajeUsuario);

            // Analytics: seguimiento de error
            if (window.gtag) {
              window.gtag('event', 'exception', {
                description: `PayPal capture error: ${issue || detalles?.name || errorMsg}`,
                fatal: false
              });
            }
          } finally {
            setLoading(false);
          }
        },
        
        // ERROR EN PAGO
        onError: (err) => {
          console.error('❌ Error PayPal JS SDK:', err);
          const errorMsg = err.message || 'Error desconocido en PayPal';
          setError(`Error al procesar el pago: ${errorMsg}`);
          setLoading(false);
          
          // Analytics: seguimiento de error
          if (window.gtag) {
            window.gtag('event', 'exception', {
              description: `PayPal SDK error: ${errorMsg}`,
              fatal: false
            });
          }
        },
        
        // CANCELAR PAGO
        onCancel: (data) => {
          console.log('⚠️ Pago cancelado por el usuario:', data);
          setError('Pago cancelado. No se realizó ningún cargo.');
          setLoading(false);
          
          // Analytics: seguimiento de cancelación
          if (window.gtag) {
            window.gtag('event', 'remove_from_cart', {
              currency: 'USD',
              value: parseFloat(monto) || 0
            });
          }
        },
        
        // INICIAR RENDERIZADO
        onInit: (data, actions) => {
          console.log('🔵 PayPal botón inicializado');
        },
        
        // AL HACER CLICK
        onClick: (data, actions) => {
          console.log('🔵 Usuario hizo click en botón PayPal');
          
          const montoNum = parseFloat(monto);
          if (!montoNum || montoNum <= 0) {
            setError('Por favor ingresa un monto válido');
            return actions.reject();
          }
          
          return actions.resolve();
        },
      }).render(paypalButtonRef.current);
    };

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
    const recargaId = params.get('recargaId'); // ID de recarga en BD

    if (cancelled === 'cancelled') {
      setError('Pago cancelado por el usuario.');
      return;
    }

    if (success === 'true' && recargaId) {
      try {
        setLoading(true);
        const authToken = localStorage.getItem('token');
        if (!authToken) {
          setError('Debes estar autenticado para completar el pago.');
          return;
        }

        const response = await axios.post(
          `${API_URL}/recargas/paypal/capturar`,
          { recargaId: recargaId },
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
  };

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

      console.log('📤 Enviando solicitud de pago a:', `${API_URL}/recargas/crear-paypal`);
      console.log('📋 Configuración API_URL:', API_URL);
      console.log('📋 Token presente:', !!token);
      
      const response = await axios.post(
        `${API_URL}/recargas/crear-paypal`,
        { monto: montoNum },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('✅ Respuesta del servidor:', response.data);

      // Verificar si hay URL de pago
      const paymentUrl = response.data.paymentUrl || response.data.checkoutUrl;
      if (paymentUrl) {
        setSuccess('✅ Redirigiendo a PayPal...');
        setTimeout(() => {
          window.location.href = paymentUrl;
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
        console.error('🔍 URL intentada:', `${API_URL}/recargas/crear-paypal`);
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

  const handlePagoWallet = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const montoNum = parseFloat(monto);
      if (!montoNum || montoNum <= 0 || montoNum < 1) {
        setError('El monto debe ser mayor a $1 USD');
        return;
      }

      if (montoNum > 10000) {
        setError('El monto máximo por transacción es $10,000 USD');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Debes estar autenticado para recargar');
        return;
      }

      const response = await axios.post(
        `${API_URL}/recargas/crear-rapyd`,
        { monto: montoNum },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const checkoutUrl = response.data.checkoutUrl;
      if (!checkoutUrl) {
        setError('El servidor no proporcionó URL de pago. Intenta de nuevo.');
        return;
      }

      setSuccess('✅ Redirigiendo a Wallet...');
      setTimeout(() => {
        window.location.href = checkoutUrl;
      }, 1200);
    } catch (err) {
      const mensajeError = err.response?.data?.mensaje || err.response?.data?.error || err.message || 'Error creando pago Wallet';
      setError(`Error: ${mensajeError}`);
    } finally {
      setLoading(false);
    }
  };

  const iniciarGooglePayMock = () => {
    setGooglePayStep('sheet');
  };

  const confirmarGooglePayMock = () => {
    setGooglePayStep('success');
  };

  const reiniciarGooglePayMock = () => {
    setGooglePayStep('start');
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
          🅿️ Pagar con PayPal
        </button>
        <button
          className={`tab-button ${activeTab === 'googlepay' ? 'active' : ''}`}
          onClick={() => setActiveTab('googlepay')}
        >
          🟢 Google Pay
        </button>
        <button
          className={`tab-button ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          📱 Wallet
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
              <h2>Pago con PayPal</h2>
              <p className="card-subtitle">Paga de forma segura con tu cuenta PayPal</p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="payment-form">
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

              {/* Botón de PayPal (JS SDK) */}
              <div className="paypal-buttons" aria-disabled={loading}>
                {loading && (
                  <div className="loading-overlay">
                    <div className="spinner"></div>
                    <p>Procesando pago...</p>
                  </div>
                )}
                <div ref={paypalButtonRef} />
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
              <div className="payment-info">
                <div className="info-section">
                  <h3>✅ Métodos de Pago Aceptados</h3>
                  <div className="payment-methods">
                    <span className="method">🅿️ PayPal</span>
                    <span className="method">💳 Tarjeta vinculada a PayPal</span>
                  </div>
                </div>

                <div className="info-section">
                  <h3>🔒 Seguridad Garantizada</h3>
                  <ul className="security-list">
                    <li>Encriptación SSL de nivel banco</li>
                    <li>Procesado por PayPal</li>
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

      {/* TAB: Google Pay (Mock) */}
      {activeTab === 'googlepay' && (
        <div className="payment-container">
          <div className="payment-card">
            <div className="card-title">
              <h2>Google Pay</h2>
              <p className="card-subtitle">Flujo de compra para revision</p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="payment-form">
              <div className="form-section">
                <label htmlFor="monto-gpay" className="monto-label">¿Cuanto deseas recargar?</label>
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
              </div>

              <button
                type="button"
                className="gpay-button"
                onClick={iniciarGooglePayMock}
              >
                <span className="gpay-label">Google Pay</span>
              </button>

              {googlePayStep === 'success' && (
                <div className="status-indicator success">
                  <span className="status-icon">✅</span>
                  <span>Pago completado (mock)</span>
                </div>
              )}
            </form>
          </div>

          {googlePayStep === 'sheet' && (
            <div className="gpay-overlay" role="dialog" aria-modal="true">
              <div className="gpay-sheet">
                <div className="gpay-sheet-header">
                  <div className="gpay-brand">
                    <span className="gpay-dot"></span>
                    <span>Google Pay</span>
                  </div>
                  <button type="button" className="gpay-close" onClick={reiniciarGooglePayMock}>
                    ✕
                  </button>
                </div>
                <div className="gpay-merchant">
                  <div>
                    <div className="gpay-merchant-name">Banco Exclusivo</div>
                    <div className="gpay-merchant-sub">Recarga de saldo</div>
                  </div>
                  <div className="gpay-total">USD ${parseFloat(monto || 0).toFixed(2)}</div>
                </div>
                <div className="gpay-sheet-body">
                  <div className="gpay-row gpay-row-stack">
                    <span>Tarjeta</span>
                    <select
                      className="gpay-select"
                      value={googlePayCard}
                      onChange={(e) => setGooglePayCard(e.target.value)}
                    >
                      <option value="visa-4242">Visa •••• 4242</option>
                      <option value="master-1111">Mastercard •••• 1111</option>
                      <option value="amex-0005">Amex •••• 0005</option>
                    </select>
                  </div>
                  <div className="gpay-row gpay-row-stack">
                    <span>Direccion</span>
                    <select
                      className="gpay-select"
                      value={googlePayAddress}
                      onChange={(e) => setGooglePayAddress(e.target.value)}
                    >
                      <option value="home">Casa - Avenida Central 123</option>
                      <option value="office">Oficina - Torre Norte, Piso 4</option>
                    </select>
                  </div>
                  <div className="gpay-row">
                    <span>Entrega</span>
                    <strong>Instantaneo</strong>
                  </div>
                </div>
                <button type="button" className="gpay-confirm" onClick={confirmarGooglePayMock}>
                  Confirmar pago
                </button>
                <div className="gpay-footnote">No se comparte tu numero real de tarjeta.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Wallet */}
      {activeTab === 'wallet' && (
        <div className="payment-container">
          <div className="payment-card">
            <div className="card-title">
              <h2>Wallet (Tarjetas y bancos)</h2>
              <p className="card-subtitle">Paga desde tu móvil con tarjeta o banco local</p>
            </div>

            <form onSubmit={handlePagoWallet} className="payment-form">
              <div className="form-section">
                <label htmlFor="monto-wallet" className="monto-label">¿Cuánto deseas recargar?</label>
                <div className="monto-input-group">
                  <span className="currency-prefix">USD $</span>
                  <input
                    id="monto-wallet"
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
                    <p className="summary-info">El proveedor mostrará métodos disponibles según tu banco</p>
                  </div>
                )}
              </div>

              <button type="submit" className="btn-payment" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner">⏳</span>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>📱</span>
                    <span>Proceder a Wallet</span>
                  </>
                )}
              </button>

              <div className="payment-info">
                <div className="info-section">
                  <h3>✅ Métodos compatibles</h3>
                  <div className="payment-methods">
                    <span className="method">💳 Visa / MasterCard</span>
                    <span className="method">🏦 Bancos locales</span>
                    <span className="method">📱 Wallet móvil</span>
                  </div>
                </div>
                <div className="info-section">
                  <h3>⚡ Flujo rápido</h3>
                  <ul className="process-list">
                    <li>1️⃣ Ingresa el monto</li>
                    <li>2️⃣ Elige tarjeta o banco</li>
                    <li>3️⃣ Confirma desde tu móvil</li>
                    <li>4️⃣ Listo, saldo disponible</li>
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

