import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { recargaAPI } from '../services/api';
import axios from 'axios';
import './Recargas.css';

// Validaciones de tarjeta
const validateCardNumber = (number) => {
  const cleaned = number.replace(/\D/g, '');
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  
  // Algoritmo de Luhn
  let sum = 0;
  let isEven = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

const getCardBrand = (number) => {
  const cleaned = number.replace(/\D/g, '');
  if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(cleaned)) return 'Visa';
  if (/^5[1-5][0-9]{14}$/.test(cleaned)) return 'Mastercard';
  if (/^3[47][0-9]{13}$/.test(cleaned)) return 'American Express';
  if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(cleaned)) return 'Discover';
  return null;
};

const validateExpiry = (month, year) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const expiryYear = parseInt(year, 10);
  const expiryMonth = parseInt(month, 10);
  
  if (expiryYear < currentYear) return false;
  if (expiryYear === currentYear && expiryMonth < currentMonth) return false;
  if (expiryMonth < 1 || expiryMonth > 12) return false;
  
  return true;
};

const validateCVV = (cvv) => {
  return /^\d{3,4}$/.test(cvv.replace(/\D/g, ''));
};

export default function Recargas() {
  const { usuario, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  // No tabs needed, only Stripe Checkout

  // Redirigir a login si no hay usuario y no está cargando
  React.useEffect(() => {
    if (!usuario && !loading) {
      navigate('/login');
    }
  }, [usuario, loading, navigate]);
  const [monto, setMonto] = useState('');
  const [loadingRecarga, setLoadingRecarga] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleMontoChange = (e) => {
    setMonto(e.target.value);
  };

  const handleRecargaStripeCheckout = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!monto || parseFloat(monto) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    setLoadingRecarga(true);
    try {
      const response = await recargaAPI.crearRecargaStripe({ monto: parseFloat(monto) });
      if (response.data && response.data.url) {
        window.location.href = response.data.url; // Redirect to Stripe Checkout
      } else {
        setError('No se pudo obtener la URL de pago.');
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

        <form onSubmit={handleRecargaStripeCheckout} className="form-section">
          <div className="form-group">
            <label>Monto a recargar ($)</label>
            <div className="monto-selector">
              {[10, 20, 50, 100, 200, 500].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`monto-btn ${monto === m.toString() ? 'selected' : ''}`}
                  onClick={() => setMonto(m.toString())}
                >
                  ${m}
                </button>
              ))}
            </div>
            <input
              type="number"
              name="monto"
              value={monto}
              onChange={handleMontoChange}
              placeholder="Otro monto"
              step="0.01"
              min="1"
              className="custom-monto"
            />
          </div>
          <div className="info-box">
            <h4>🔒 Información Segura</h4>
            <ul>
              <li>✓ Procesamiento seguro con Stripe, PayPal y Google Pay</li>
              <li>✓ Datos encriptados con SSL/TLS</li>
              <li>✓ Cumplimiento PCI DSS</li>
            </ul>
          </div>
          <button
            type="submit"
            disabled={loadingRecarga || !monto}
            className="btn-submit"
          >
            {loadingRecarga ? 'Redirigiendo...' : `Recargar $${parseFloat(monto || 0).toFixed(2)} con Stripe, PayPal o Google Pay`}
          </button>
        </form>

// ...existing code...
        </form>
      </div>
    </div>
  );
}
