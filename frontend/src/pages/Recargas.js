import React, { useState } from 'react';
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
  const [paymentId, setPaymentId] = useState('');

  const handleRecargaRapyd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!monto || monto <= 0) {
        setError('Ingrese un monto válido');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/recargas/crear-rapyd`,
        { monto: parseFloat(monto) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Checkout Rapyd creado:', response.data);
      
      // Redirigir al usuario a la URL de pago de Rapyd
      if (response.data.checkoutUrl) {
        setSuccess(`Redirigiendo a pago seguro...`);
        window.location.href = response.data.checkoutUrl;
      } else {
        setError('No se recibió URL de pago');
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error creando recarga Rapyd');
      console.error('❌ Error Rapyd:', err);
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
      if (!codigoRecarga) {
        setError('Ingrese un código de recarga');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/recargas/canjear-codigo`,
        { codigo: codigoRecarga },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`¡Código canjeado! Saldo agregado: $${response.data.montoAgregado}`);
      setCodigoRecarga('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Código inválido o ya utilizado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recargas-container">
      <div className="recargas-header">
        <h1>💰 Recargar Saldo</h1>
        <p>Elige tu método de recarga preferido</p>
      </div>

      <div className="recargas-tabs">
        <button
          className={`tab-button ${activeTab === 'rapyd' ? 'active' : ''}`}
          onClick={() => setActiveTab('rapyd')}
        >
          💳 Tarjeta (Rapyd)
        </button>
        <button
          className={`tab-button ${activeTab === 'codigo' ? 'active' : ''}`}
          onClick={() => setActiveTab('codigo')}
        >
          🎟️ Código de Recarga
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Tab Rapyd */}
      {activeTab === 'rapyd' && (
        <div className="recarga-form-card">
          <h2>💳 Recarga con Tarjeta de Crédito/Débito</h2>
          <p className="form-description">Usa Rapyd para recargar tu saldo de forma segura (Dinero real)</p>

          <div className="moneda-info">
            <span className="moneda-badge">💵 USD (Dólares Estadounidenses)</span>
          </div>

          <form onSubmit={handleRecargaRapyd}>
            <div className="form-group">
              <label>Monto a Recargar</label>
              <div className="input-with-currency">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="100.00"
                  step="0.01"
                  min="1"
                  required
                />
                <span className="currency-code">USD</span>
              </div>
            </div>

            <div className="monto-presets">
              <button
                type="button"
                className="preset-btn"
                onClick={() => setMonto('10')}
              >
                $10 USD
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => setMonto('25')}
              >
                $25 USD
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => setMonto('50')}
              >
                $50 USD
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => setMonto('100')}
              >
                $100 USD
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => setMonto('250')}
              >
                $250 USD
              </button>
            </div>

            <button type="submit" className="btn-submit" disabled={loading || !monto}>
              {loading ? '⏳ Procesando...' : '🔒 Ir a Pago Seguro'}
            </button>

            <div className="info-box">
              <p>✅ Pagos seguros procesados por Stripe</p>
              <p>✅ Se agrega instantáneamente a tu saldo en USD</p>
              <p>✅ Sin comisiones adicionales</p>
            </div>
          </form>
        </div>
      )}

      {/* Tab Código */}
      {activeTab === 'codigo' && (
        <div className="recarga-form-card">
          <h2>🎟️ Canjear Código de Recarga</h2>
          <p className="form-description">¿Ya tienes un código? Úsalo aquí para agregar saldo</p>

          <form onSubmit={handleCanjearCodigo}>
            <div className="form-group">
              <label>Código de Recarga</label>
              <input
                type="text"
                value={codigoRecarga}
                onChange={(e) => setCodigoRecarga(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                maxLength="19"
                required
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading || !codigoRecarga}>
              {loading ? '⏳ Canjeando...' : '🎁 Canjear Código'}
            </button>

            <div className="info-box">
              <p>💡 Los códigos de recarga se pueden comprar o recibir como regalo</p>
              <p>✅ Cada código se puede usar una sola vez</p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

