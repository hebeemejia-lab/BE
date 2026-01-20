import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { recargaAPI } from '../services/api';
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
  const [activeTab, setActiveTab] = useState('tarjeta'); // tarjeta | codigo

  // Redirigir a login si no hay usuario y no está cargando
  React.useEffect(() => {
    if (!usuario && !loading) {
      navigate('/login');
    }
  }, [usuario, loading, navigate]);
  const [formData, setFormData] = useState({
    monto: '',
    codigo: '',
    // Datos de tarjeta
    numeroTarjeta: '',
    nombreTitular: '',
    mesVencimiento: '',
    anoVencimiento: '',
    cvv: '',
    tipoTarjeta: 'credito', // credito | debito | ahorros
  });
  const [cardData, setCardData] = useState({
    brand: null,
    isValid: false,
    cardType: 'credito',
  });
  const [loadingRecarga, setLoadingRecarga] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Validaciones de tarjeta en tiempo real
    if (name === 'numeroTarjeta') {
      const brand = getCardBrand(value);
      const isValid = validateCardNumber(value);
      setCardData({
        brand,
        isValid,
        cardType: formData.tipoTarjeta,
      });
    }
  };

  const handleRecargaTarjeta = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }

    if (!validateCardNumber(formData.numeroTarjeta)) {
      setError('Número de tarjeta inválido');
      return;
    }

    // Formatear mes y año (aceptar año de 2 o 4 dígitos)
    let mes = formData.mesVencimiento.toString().padStart(2, '0');
    let ano = formData.anoVencimiento.toString();
    if (ano.length === 2) {
      ano = '20' + ano;
    }

    if (!validateExpiry(mes, ano)) {
      setError('Fecha de vencimiento inválida o expirada');
      return;
    }

    // Mostrar el payload en consola para depuración
    const payload = {
      ...formData,
      mesVencimiento: mes,
      anoVencimiento: ano,
    };
    console.log('Payload enviado a la API:', payload);

    if (!validateCVV(formData.cvv)) {
      setError('CVV debe tener 3 o 4 dígitos');
      return;
    }

    if (!formData.nombreTitular.trim()) {
      setError('Nombre del titular requerido');
      return;
    }

    setLoadingRecarga(true);

    try {
      // Forzar año a 4 dígitos y mes a 2 dígitos
      const mesFinal = formData.mesVencimiento.toString().padStart(2, '0');
      let anoFinal = formData.anoVencimiento.toString();
      if (anoFinal.length === 2) {
        anoFinal = '20' + anoFinal;
      }
      const response = await recargaAPI.procesarRecargaTarjeta({
        monto: parseFloat(formData.monto),
        numeroTarjeta: formData.numeroTarjeta.replace(/\D/g, ''),
        nombreTitular: formData.nombreTitular,
        mesVencimiento: mesFinal,
        anoVencimiento: anoFinal,
        cvv: formData.cvv,
        tipoTarjeta: formData.tipoTarjeta,
        brand: cardData.brand,
      });

      setSuccess(`✓ Recarga exitosa. +$${response.data.montoAgregado}. Ref: ${response.data.numeroReferencia}`);
      
      setFormData({
        monto: '',
        codigo: '',
        numeroTarjeta: '',
        nombreTitular: '',
        mesVencimiento: '',
        anoVencimiento: '',
        cvv: '',
        tipoTarjeta: 'credito',
      });
      setCardData({ brand: null, isValid: false, cardType: 'credito' });
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error procesando recarga');
    } finally {
      setLoadingRecarga(false);
    }
  };

  // Canjear código
  const handleCanjearCodigo = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingRecarga(true);

    try {
      const response = await recargaAPI.canjearcoCodigo({
        codigo: formData.codigo.toUpperCase(),
      });

      setSuccess(`✓ Código canjeado. +$${response.data.montoAgregado}`);
      
      setFormData({ monto: '', codigo: '' });
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error canjeando código');
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

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'tarjeta' ? 'active' : ''}`}
            onClick={() => setActiveTab('tarjeta')}
          >
            💳 Tarjeta de Crédito
          </button>
        </div>

        {/* Recarga con Tarjeta */}
        {activeTab === 'tarjeta' && (
          <form onSubmit={handleRecargaTarjeta} className="form-section">
            {/* Monto */}
            <div className="form-group">
              <label>Monto a recargar ($)</label>
              <div className="monto-selector">
                {[10, 20, 50, 100, 200, 500].map((monto) => (
                  <button
                    key={monto}
                    type="button"
                    className={`monto-btn ${formData.monto === monto.toString() ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, monto: monto.toString() })}
                  >
                    ${monto}
                  </button>
                ))}
              </div>
              <input
                type="number"
                name="monto"
                value={formData.monto}
                onChange={handleChange}
                placeholder="Otro monto"
                step="0.01"
                min="1"
                className="custom-monto"
              />
            </div>

            {/* Tipo de tarjeta */}
            <div className="form-group">
              <label>Tipo de Tarjeta</label>
              <div className="card-type-selector">
                <label className="radio-card">
                  <input
                    type="radio"
                    name="tipoTarjeta"
                    value="credito"
                    checked={formData.tipoTarjeta === 'credito'}
                    onChange={handleChange}
                  />
                  <span className="radio-label">💳 Crédito</span>
                </label>
                <label className="radio-card">
                  <input
                    type="radio"
                    name="tipoTarjeta"
                    value="debito"
                    checked={formData.tipoTarjeta === 'debito'}
                    onChange={handleChange}
                  />
                  <span className="radio-label">🏦 Débito</span>
                </label>
                <label className="radio-card">
                  <input
                    type="radio"
                    name="tipoTarjeta"
                    value="ahorros"
                    checked={formData.tipoTarjeta === 'ahorros'}
                    onChange={handleChange}
                  />
                  <span className="radio-label">💰 Ahorros</span>
                </label>
              </div>
            </div>

            {/* Número de tarjeta */}
            <div className="form-group">
              <label>
                Número de Tarjeta
                {cardData.brand && <span className="card-brand"> ({cardData.brand})</span>}
              </label>
              <div className="card-input-group">
                <input
                  type="text"
                  name="numeroTarjeta"
                  value={formData.numeroTarjeta}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 19);
                    const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
                    handleChange({ ...e, target: { ...e.target, value: formatted, name: 'numeroTarjeta' } });
                  }}
                  placeholder="1234 5678 9012 3456"
                  maxLength="23"
                  required
                  autoComplete="cc-number"
                />
                {cardData.isValid && <span className="check-icon">✓</span>}
                {formData.numeroTarjeta && !cardData.isValid && <span className="error-icon">✗</span>}
              </div>
              {formData.numeroTarjeta && !cardData.isValid && (
                <small className="error-text">Número de tarjeta inválido</small>
              )}
            </div>

            {/* Nombre titular */}
            <div className="form-group">
              <label>Nombre del Titular</label>
              <input
                type="text"
                name="nombreTitular"
                value={formData.nombreTitular}
                onChange={handleChange}
                placeholder="Juan Pérez"
                required
                autoComplete="cc-name"
              />
            </div>

            {/* Fecha y CVV */}
            <div className="form-row">
              <div className="form-group">
                <label>Vencimiento (MM/AA)</label>
                <div className="date-inputs">
                  <input
                    type="text"
                    name="mesVencimiento"
                    value={formData.mesVencimiento}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                      if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 12)) {
                        handleChange({ ...e, target: { ...e.target, value: val, name: 'mesVencimiento' } });
                      }
                    }}
                    placeholder="MM"
                    maxLength="2"
                    required
                    autoComplete="cc-exp-month"
                  />
                  <span>/</span>
                  <input
                    type="text"
                    name="anoVencimiento"
                    value={formData.anoVencimiento}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                      handleChange({ ...e, target: { ...e.target, value: val, name: 'anoVencimiento' } });
                    }}
                    placeholder="AA"
                    maxLength="2"
                    required
                    autoComplete="cc-exp-year"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>CVV/CVC</label>
                <input
                  type="password"
                  name="cvv"
                  value={formData.cvv}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    handleChange({ ...e, target: { ...e.target, value: val, name: 'cvv' } });
                  }}
                  placeholder="123"
                  maxLength="4"
                  required
                  autoComplete="cc-csc"
                />
              </div>
            </div>

            <div className="info-box">
              <h4>🔒 Información Segura</h4>
              <ul>
                <li>✓ Datos encriptados con SSL/TLS</li>
                <li>✓ Cumplimiento PCI DSS</li>
                <li>✓ Nunca guardamos tu CVV</li>
                <li>✓ Procesamiento seguro con Stripe</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loadingRecarga || !formData.monto || !cardData.isValid || !formData.nombreTitular || !formData.mesVencimiento || !formData.anoVencimiento || !formData.cvv}
              className="btn-submit"
            >
              {loadingRecarga ? 'Procesando...' : `Recargar $${parseFloat(formData.monto || 0).toFixed(2)}`}
            </button>
          </form>
        )}

        {/* Canjear Código */}
          {/* Código de Recarga eliminado */}
      </div>

      {/* Historial */}
      <div className="historial-card">
        <h3>Historial de Recargas</h3>
        <div className="historial-tabla">
          <table>
            <thead>
              <tr>
                <th>Monto</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Referencia</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
