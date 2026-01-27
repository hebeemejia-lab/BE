
import React, { useState, useRef } from 'react';
import axios from 'axios';

export default function RecargaTwoCheckout() {
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const formRef = useRef();

  // 2Pay.js config
  const merchant = process.env.REACT_APP_2CHECKOUT_MERCHANT_CODE || window.REACT_APP_2CHECKOUT_MERCHANT_CODE || 'YOUR_MERCHANT_CODE';
  const publishableKey = process.env.REACT_APP_2CHECKOUT_PUBLISHABLE_KEY || window.REACT_APP_2CHECKOUT_PUBLISHABLE_KEY || 'YOUR_PUBLISHABLE_KEY';

  // Cargar 2Pay.js si no está
  React.useEffect(() => {
    if (!window.TCO) {
      const script = document.createElement('script');
      script.src = 'https://2pay-js.2checkout.com/v1/2pay.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!monto || parseFloat(monto) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    setLoading(true);

    // Validar que 2Pay.js esté cargado
    if (!window.TCO) {
      setError('No se pudo cargar el formulario de pago. Intenta de nuevo.');
      setLoading(false);
      return;
    }

    // Configurar 2Pay.js
    window.TCO.loadPubKey('sandbox', () => {
      window.TCO.requestToken(
        async (data) => {
          // Token recibido, enviar al backend
          try {
            const tokenAuth = localStorage.getItem('token');
            const res = await axios.post(
              '/api/recargas/crear-2checkout',
              { monto, token: data.response.token.token },
              { headers: { Authorization: `Bearer ${tokenAuth}` } }
            );
            setSuccess('Recarga exitosa. Nuevo saldo: $' + res.data.nuevoSaldo);
          } catch (err) {
            setError(err.response?.data?.mensaje || 'Error procesando el pago');
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setError('Error con el pago: ' + (err.errorMsg || 'Tokenización fallida'));
          setLoading(false);
        },
        {
          sellerId: merchant,
          publishableKey,
          ccNo: formRef.current['ccNo'].value,
          cvv: formRef.current['cvv'].value,
          expMonth: formRef.current['expMonth'].value,
          expYear: formRef.current['expYear'].value,
          currency: 'USD',
          amount: monto,
        }
      );
    });
  };

  return (
    <div className="recargas-container">
      <h2>Recargar saldo (2Checkout Inline)</h2>
      <form className="form-section" ref={formRef} onSubmit={handleSubmit} autoComplete="on">
        <div className="form-group">
          <label>Monto a recargar ($)</label>
          <input
            type="number"
            name="monto"
            value={monto}
            onChange={e => setMonto(e.target.value)}
            placeholder="Ingresa el monto"
            step="0.01"
            min="1"
            className="custom-monto"
            required
          />
        </div>
        <div className="form-group">
          <label>Número de tarjeta</label>
          <input type="text" name="ccNo" placeholder="4111 1111 1111 1111" required maxLength={19} />
        </div>
        <div className="form-group">
          <label>CVV</label>
          <input type="text" name="cvv" placeholder="123" required maxLength={4} />
        </div>
        <div className="form-group">
          <label>Mes de expiración</label>
          <input type="text" name="expMonth" placeholder="MM" required maxLength={2} />
        </div>
        <div className="form-group">
          <label>Año de expiración</label>
          <input type="text" name="expYear" placeholder="YY" required maxLength={2} />
        </div>
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Procesando...' : 'Pagar con 2Checkout'}
        </button>
      </form>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
}
