import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './TransferenciasInternacionales.module.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function TransferenciasInternacionales() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tasa, setTasa] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [formData, setFormData] = useState({
    paisDestino: '',
    monedaDestino: 'USD',
    monto: '',
    nombreBeneficiario: '',
    apellidoBeneficiario: '',
    emailBeneficiario: '',
    telefonoBeneficiario: '',
    numeroCuenta: '',
    codigoBanco: '',
    tipoCuenta: 'checking',
    metodoPago: 'bank',
    descripcion: '',
  });

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/transferencias-internacionales/historial`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistorial(response.data.transferencias || []);
    } catch (err) {
      console.error('Error cargando historial:', err);
    }
  };

  const consultarTasa = async () => {
    if (!formData.monto || formData.monto <= 0) {
      setError('Ingrese un monto válido para consultar la tasa');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/transferencias-internacionales/tasa-cambio`, {
        params: {
          monedaOrigen: 'USD',
          monedaDestino: formData.monedaDestino,
          monto: formData.monto,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasa(response.data.tasa);
      setError('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error consultando tasa de cambio');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Reset tasa si cambia monto o moneda
    if (e.target.name === 'monto' || e.target.name === 'monedaDestino') {
      setTasa(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/transferencias-internacionales/crear`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`¡Transferencia creada! Nuevo saldo: $${response.data.nuevoSaldo}`);
      setFormData({
        paisDestino: '',
        monedaDestino: 'USD',
        monto: '',
        nombreBeneficiario: '',
        apellidoBeneficiario: '',
        emailBeneficiario: '',
        telefonoBeneficiario: '',
        numeroCuenta: '',
        codigoBanco: '',
        tipoCuenta: 'checking',
        metodoPago: 'bank',
        descripcion: '',
      });
      setTasa(null);
      cargarHistorial();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error creando transferencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transferencias-internacionales-container">
      <div className="header">
        <h1>🌍 Transferencias Internacionales</h1>
        <p>Envía dinero a cualquier parte del mundo</p>
        <button 
          className="btn-historial"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? '📝 Nuevo Envío' : '📋 Ver Historial'}
        </button>
      </div>

      {!showHistory ? (
        <div className="transfer-form-card">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>💰 Detalles de la Transferencia</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>País Destino</label>
                  <select
                    name="paisDestino"
                    value={formData.paisDestino}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar país</option>
                    <option value="MX">🇲🇽 México</option>
                    <option value="CO">🇨🇴 Colombia</option>
                    <option value="VE">🇻🇪 Venezuela</option>
                    <option value="AR">🇦🇷 Argentina</option>
                    <option value="CL">🇨🇱 Chile</option>
                    <option value="PE">🇵🇪 Perú</option>
                    <option value="BR">🇧🇷 Brasil</option>
                    <option value="ES">🇪🇸 España</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Moneda</label>
                  <select
                    name="monedaDestino"
                    value={formData.monedaDestino}
                    onChange={handleChange}
                    required
                  >
                    <option value="USD">USD - Dólar</option>
                    <option value="MXN">MXN - Peso Mexicano</option>
                    <option value="COP">COP - Peso Colombiano</option>
                    <option value="VES">VES - Bolívar</option>
                    <option value="ARS">ARS - Peso Argentino</option>
                    <option value="CLP">CLP - Peso Chileno</option>
                    <option value="PEN">PEN - Sol Peruano</option>
                    <option value="BRL">BRL - Real Brasileño</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Monto a Enviar (USD)</label>
                  <input
                    type="number"
                    name="monto"
                    value={formData.monto}
                    onChange={handleChange}
                    placeholder="100.00"
                    step="0.01"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <button
                    type="button"
                    className="btn-consultar-tasa"
                    onClick={consultarTasa}
                    disabled={loading}
                  >
                    💱 Consultar Tasa
                  </button>
                </div>
              </div>

              {tasa && (
                <div className="tasa-info">
                  <p>💵 Tasa de cambio: 1 USD = {tasa.rate} {formData.monedaDestino}</p>
                  <p>✅ El beneficiario recibirá aproximadamente: <strong>{(formData.monto * tasa.rate).toFixed(2)} {formData.monedaDestino}</strong></p>
                </div>
              )}
            </div>

            <div className="form-section">
              <h3>👤 Datos del Beneficiario</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="nombreBeneficiario"
                    value={formData.nombreBeneficiario}
                    onChange={handleChange}
                    placeholder="Juan"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Apellido</label>
                  <input
                    type="text"
                    name="apellidoBeneficiario"
                    value={formData.apellidoBeneficiario}
                    onChange={handleChange}
                    placeholder="Pérez"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email (opcional)</label>
                  <input
                    type="email"
                    name="emailBeneficiario"
                    value={formData.emailBeneficiario}
                    onChange={handleChange}
                    placeholder="beneficiario@ejemplo.com"
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono (opcional)</label>
                  <input
                    type="tel"
                    name="telefonoBeneficiario"
                    value={formData.telefonoBeneficiario}
                    onChange={handleChange}
                    placeholder="+52 123 456 7890"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>🏦 Datos Bancarios</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Número de Cuenta</label>
                  <input
                    type="text"
                    name="numeroCuenta"
                    value={formData.numeroCuenta}
                    onChange={handleChange}
                    placeholder="1234567890"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Código del Banco</label>
                  <input
                    type="text"
                    name="codigoBanco"
                    value={formData.codigoBanco}
                    onChange={handleChange}
                    placeholder="012345"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Cuenta</label>
                  <select
                    name="tipoCuenta"
                    value={formData.tipoCuenta}
                    onChange={handleChange}
                    required
                  >
                    <option value="checking">Cuenta Corriente</option>
                    <option value="savings">Cuenta de Ahorros</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Método de Pago</label>
                  <select
                    name="metodoPago"
                    value={formData.metodoPago}
                    onChange={handleChange}
                    required
                  >
                    <option value="bank">Transferencia Bancaria</option>
                    <option value="cash">Efectivo</option>
                    <option value="wallet">Wallet Digital</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Descripción (opcional)</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Concepto de la transferencia"
                  rows="2"
                />
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={loading || !tasa}>
              {loading ? '⏳ Procesando...' : '🚀 Enviar Transferencia'}
            </button>
          </form>
        </div>
      ) : (
        <div className="historial-card">
          <h2>📋 Historial de Transferencias Internacionales</h2>
          {historial.length === 0 ? (
            <p className="empty-state">No hay transferencias internacionales</p>
          ) : (
            <div className="historial-list">
              {historial.map((transfer) => (
                <div key={transfer.id} className="historial-item">
                  <div className="transfer-header">
                    <span className="transfer-destino">
                      🌍 {transfer.paisDestino} - {transfer.nombreBeneficiario} {transfer.apellidoBeneficiario}
                    </span>
                    <span className={`badge badge-${transfer.estado}`}>
                      {transfer.estado}
                    </span>
                  </div>
                  <div className="transfer-details">
                    <p><strong>Monto:</strong> ${parseFloat(transfer.monto).toFixed(2)} USD</p>
                    <p><strong>Método:</strong> {transfer.metodoPago}</p>
                    <p><strong>Fecha:</strong> {new Date(transfer.createdAt).toLocaleDateString()}</p>
                    {transfer.descripcion && <p><strong>Concepto:</strong> {transfer.descripcion}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
