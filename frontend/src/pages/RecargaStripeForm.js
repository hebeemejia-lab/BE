import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

export default function RecargaStripeForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!monto || parseFloat(monto) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      // 1. Crear PaymentIntent en backend
      const { data } = await axios.post('/api/recargas/crear-payment-intent', { monto });
      // 2. Confirmar pago con Stripe
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });
      if (result.error) {
        setError(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        setSuccess('Recarga exitosa. Monto: $' + monto);
      }
    } catch (err) {
      setError('Error procesando el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-section" onSubmit={handleSubmit} autoComplete="on">
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
        <label>Datos de Tarjeta</label>
        <CardElement options={{ hidePostalCode: true }} />
      </div>
      <div style={{ marginTop: 16 }}>
        <button type="submit" className="btn-submit" disabled={loading || !stripe}>
          {loading ? 'Procesando...' : 'Pagar'}
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </form>
  );
}
