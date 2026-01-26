import React, { useState } from 'react';
import axios from 'axios';

export default function RecargaMercadoPago() {
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initPoint, setInitPoint] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInitPoint('');
    if (!monto || parseFloat(monto) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        '/api/recargas/crear-mercadopago',
        { monto },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInitPoint(data.init_point);
    } catch (err) {
      setError('Error creando la recarga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recargas-container">
      <h2>Recargar saldo (Mercado Pago)</h2>
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
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Procesando...' : 'Pagar con Mercado Pago'}
        </button>
      </form>
      {error && <div className="error-message">{error}</div>}
      {initPoint && (
        <div style={{ marginTop: 24 }}>
          <a href={initPoint} target="_blank" rel="noopener noreferrer" className="btn-submit">
            Ir al formulario de pago
          </a>
        </div>
      )}
    </div>
  );
}
