import React, { useState, useContext, useRef } from 'react';
import CryptoForm from '../components/CryptoForm';
import { QRCodeSVG } from 'qrcode.react';
import { AuthContext } from '../context/AuthContext';
import { bankAccountAPI, retiroAPI } from '../services/api';
import API from '../services/api';
import './Retiros.css';

export default function Retiros() {
  const { usuario, refrescarPerfil } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    monto: '',
    moneda: 'USD', // USD, DOP, EUR
    cuentaId: '',
    metodoRetiro: 'transferencia_manual',
  });
  const [cuentas, setCuentas] = useState([]);
  const [cuentaPrincipal, setCuentaPrincipal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cuentasLoading, setCuentasLoading] = useState(true);
  const [retiros, setRetiros] = useState([]);
  const [retirosLoading, setRetirosLoading] = useState(true);
  const [verificado, setVerificado] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [verificationStep, setVerificationStep] = useState('email'); // 'email' or 'code'
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [retiroFormOpen, setRetiroFormOpen] = useState(true);
  const [historialOpen, setHistorialOpen] = useState(true);
  const retiroFormRef = useRef(null);

  // Cargar cuentas vinculadas al montar
  React.useEffect(() => {
    cargarCuentas();
    cargarRetiros();
    cargarCuentaPrincipal();
  }, []);

  React.useEffect(() => {
    if (verificado) {
      setRetiroFormOpen(true);
      requestAnimationFrame(() => {
        retiroFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [verificado]);

  const cargarCuentaPrincipal = async () => {
    try {
      const response = await retiroAPI.obtenerCuentaPrincipal();
      setCuentaPrincipal(response.data.cuenta);
    } catch (err) {
      console.error('Error cargando cuenta principal:', err);
    }
  };

  const cargarRetiros = async () => {
    try {
      setRetirosLoading(true);
      const response = await retiroAPI.obtenerHistorial();
      setRetiros(response.data);
    } catch (err) {
      setError('No se pudo cargar el historial de retiros');
    } finally {
      setRetirosLoading(false);
    }
  };

  const cargarCuentas = async () => {
    try {
      setCuentasLoading(true);
      const response = await bankAccountAPI.listarCuentas();
      setCuentas(response.data);
      // Seleccionar la cuenta por defecto
      const cuentaDefault = response.data.find(c => c.esDefault);
      if (cuentaDefault) {
        setFormData(prev => ({ ...prev, cuentaId: cuentaDefault.id }));
      }
    } catch (err) {
      console.error('Error cargando cuentas:', err);
      setError('No se pudieron cargar las cuentas vinculadas');
    } finally {
      setCuentasLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validarFormulario = () => {
    const monto = parseFloat(formData.monto);
    
    if (!formData.monto || monto <= 0) {
      setError('Ingresa un monto válido');
      return false;
    }

    if (monto > parseFloat(usuario?.saldo || 0)) {
      setError('Saldo insuficiente para este retiro');
      return false;
    }

    if (!formData.cuentaId) {
      setError('Selecciona una cuenta bancaria');
      return false;
    }

    const cuenta = cuentas.find(c => c.id === parseInt(formData.cuentaId));
    if (!cuenta || cuenta.estado !== 'verificada') {
      setError('La cuenta seleccionada no está verificada');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validarFormulario()) return;

    setLoading(true);

    try {
      const { data } = await retiroAPI.procesar({
        monto: parseFloat(formData.monto),
        moneda: formData.moneda,
        cuentaId: parseInt(formData.cuentaId),
        metodoRetiro: formData.metodoRetiro,
      });

      setSuccess(`✓ Retiro exitoso. -$${formData.monto} ${formData.moneda}. Ref: ${data.numeroReferencia}`);
      setFormData({
        monto: '',
        moneda: 'USD',
        cuentaId: formData.cuentaId,
        metodoRetiro: formData.metodoRetiro,
      });

      // Refrescar historial de retiros y saldo
      await cargarRetiros();
      await refrescarPerfil(); // ✅ Actualiza el saldo en el contexto
      
    } catch (err) {
      setError(err.message || 'Error procesando el retiro');
    } finally {
      setLoading(false);
    }
  };

  const monedas = [
    { codigo: 'USD', simbolo: '$', nombre: 'Dólar Estadounidense' },
    { codigo: 'DOP', simbolo: 'RD$', nombre: 'Peso Dominicano' },
    { codigo: 'EUR', simbolo: '€', nombre: 'Euro' },
  ];

  const monedaSeleccionada = monedas.find(m => m.codigo === formData.moneda);

  if (cuentasLoading) {
    return (
      <div className="retiros-container">
        <div className="retiros-card">
          <div className="loading-spinner">Cargando cuentas...</div>
        </div>
      </div>
    );
  }

  if (cuentas.length === 0) {
    return (
      <div className="retiros-container">
        <div className="retiros-card">
          <div className="card-header">
            <h2>💳 Retirar Dinero</h2>
            <p>Transfiere fondos a tu cuenta bancaria</p>
          </div>
          <div className="empty-state">
            <p>📌 No tienes cuentas bancarias vinculadas</p>
            <p>Para retirar dinero, primero debes:</p>
            <ol>
              <li>Ir a <strong>Cuentas Bancarias</strong></li>
              <li>Vincular una cuenta</li>
              <li>Verificarla con microdeposits</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="retiros-container">
      <div className="retiros-card">
        <div className="card-header">
          <h2>💳 Retirar Dinero</h2>
          <p>Transfiere fondos a tu cuenta bancaria</p>
        </div>

        <div className="retiros-toggle">
          <button
            type="button"
            className={`retiros-toggle-btn ${retiroFormOpen ? 'open' : ''}`}
            onClick={() => setRetiroFormOpen((prev) => !prev)}
          >
            Solicitud de retiro
            <span className="retiros-toggle-icon">{retiroFormOpen ? '−' : '+'}</span>
          </button>
        </div>

        <div className="saldo-actual">
          <span>Saldo disponible:</span>
          <h3>${parseFloat(usuario?.saldo || 0).toFixed(2)}</h3>
        </div>

        <div className={`retiros-section ${retiroFormOpen ? 'open' : 'collapsed'}`}>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Información de la cuenta bancaria principal */}
          {cuentaPrincipal && (
            <div className="cuenta-principal-info">
              <div className="info-header">
                <h4>🏦 Cuenta Principal para Retiros</h4>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Banco:</span>
                  <span className="value">{cuentaPrincipal.banco}</span>
                </div>
                <div className="info-item">
                  <span className="label">Titular:</span>
                  <span className="value">{cuentaPrincipal.nombreTitular}</span>
                </div>
                <div className="info-item">
                  <span className="label">Tipo de Cuenta:</span>
                  <span className="value">{cuentaPrincipal.tipoCuenta}</span>
                </div>
                <div className="info-item">
                  <span className="label">Número de Cuenta:</span>
                  <span className="value">{cuentaPrincipal.numeroCuenta}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{cuentaPrincipal.email}</span>
                </div>
                <div className="info-item">
                  <span className="label">Monedas:</span>
                  <span className="value">{cuentaPrincipal.monedas.join(', ')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Verificación de identidad antes de mostrar el formulario */}
          {!verificado ? (
            <div className="verification-section">
              {verificationStep === 'email' ? (
                <form className="form-section" onSubmit={async (e) => {
                  e.preventDefault();
                  if (emailInput === usuario?.email) {
                    // Generate random 6-digit code
                    const code = Math.floor(100000 + Math.random() * 900000).toString();
                    setSentCode(code);
                    setVerificationStep('code');
                    setError('');
                    setSuccess(`Código de verificación enviado a ${emailInput}: ${code}`);
                    // In production, this would send an actual email
                  } else {
                    setError('El email no coincide con tu cuenta. Intenta de nuevo.');
                  }
                }}>
                  <div className="form-group">
                    <label>Verifica tu identidad con tu email</label>
                    <input
                      type="email"
                      className="verification-email-input"
                      placeholder="Ingresa tu email"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                  <button type="submit" className="btn-submit">Enviar Código</button>
                </form>
              ) : (
                <form className="form-section" onSubmit={(e) => {
                  e.preventDefault();
                  if (verificationCode === sentCode) {
                    setVerificado(true);
                    setError('');
                    setSuccess('Verificación exitosa. Ahora puedes retirar fondos.');
                  } else {
                    setError('Código incorrecto. Intenta de nuevo.');
                  }
                }}>
                  <div className="form-group">
                    <label>Ingresa el código de verificación</label>
                    <input
                      type="text"
                      className="verification-code-input"
                      placeholder="Ingresa el código de 6 dígitos"
                      value={verificationCode}
                      onChange={e => setVerificationCode(e.target.value)}
                      maxLength={6}
                      autoFocus
                      required
                    />
                    <small>Código enviado a: {emailInput}</small>
                  </div>
                  <button type="submit" className="btn-submit">Verificar Código</button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => {
                      setVerificationStep('email');
                      setVerificationCode('');
                    }}
                  >
                    Volver a enviar código
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="form-section" ref={retiroFormRef}>
            {/* Monto */}
            <div className="form-group">
              <label>Monto a retirar</label>
              <div className="monto-input-group">
                <span className="currency-symbol">{monedaSeleccionada?.simbolo}</span>
                <input
                  type="number"
                  name="monto"
                  value={formData.monto}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max={parseFloat(usuario?.saldo || 0)}
                />
              </div>
              <div className="monto-presets">
                {[50, 100, 200, 500, 1000].map((monto) => (
                  <button
                    key={monto}
                    type="button"
                    className={`monto-btn ${formData.monto === monto.toString() ? 'selected' : ''}`}
                    onClick={() => {
                      if (monto <= parseFloat(usuario?.saldo || 0)) {
                        setFormData({ ...formData, monto: monto.toString() });
                      }
                    }}
                  >
                    {monedaSeleccionada?.simbolo}{monto}
                  </button>
                ))}
              </div>
            </div>

            {/* Moneda */}
            <div className="form-group">
              <label>Moneda</label>
              <div className="moneda-selector">
                {monedas.map((m) => (
                  <label key={m.codigo} className="moneda-option">
                    <input
                      type="radio"
                      name="moneda"
                      value={m.codigo}
                      checked={formData.moneda === m.codigo}
                      onChange={handleChange}
                    />
                    <span className="moneda-label">
                      <strong>{m.simbolo} {m.codigo}</strong>
                      <small>{m.nombre}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Metodo de retiro */}
            <div className="form-group">
              <label>Metodo de retiro</label>
              <div className="moneda-selector">
                <label className="moneda-option">
                  <input
                    type="radio"
                    name="metodoRetiro"
                    value="transferencia_manual"
                    checked={formData.metodoRetiro === 'transferencia_manual'}
                    onChange={handleChange}
                  />
                  <span className="moneda-label">
                    <strong>Retiro en efectivo</strong>
                    <small>Se valida y aprueba por el admin</small>
                  </span>
                </label>
                <label className="moneda-option">
                  <input
                    type="radio"
                    name="metodoRetiro"
                    value="paypal_payout"
                    checked={formData.metodoRetiro === 'paypal_payout'}
                    onChange={handleChange}
                  />
                  <span className="moneda-label">
                    <strong>PayPal Payout</strong>
                    <small>Transferencia automatica</small>
                  </span>
                </label>
              </div>
            </div>

            {/* Cuenta Bancaria */}
            <div className="form-group">
              <label>Cuenta de Destino</label>
              <select
                name="cuentaId"
                value={formData.cuentaId}
                onChange={handleChange}
                required
              >
                <option value="">-- Selecciona una cuenta --</option>
                {cuentas.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {cuenta.nombreCuenta} ({cuenta.banco}) - ****{cuenta.numerosCuenta}
                    {cuenta.esDefault && ' (Por defecto)'}
                    {cuenta.estado !== 'verificada' && ' - No verificada'}
                  </option>
                ))}
              </select>
              <small className="help-text">
                Solo puedes retirar a cuentas verificadas
              </small>
            </div>

            {/* Información */}
            <div className="info-box">
              <h4>ℹ️ Información de Retiro</h4>
              <ul>
                <li>
                  ✓ {formData.metodoRetiro === 'transferencia_manual'
                    ? 'Se procesa manualmente tras aprobacion'
                    : 'Transferencia a 1-2 dias habiles'}
                </li>
                <li>✓ Sin comision de retiro</li>
                <li>✓ Monto máximo: ${parseFloat(usuario?.saldo || 0).toFixed(2)}</li>
                <li>✓ Número de referencia para seguimiento</li>
              </ul>
            </div>

              <button
                type="submit"
                disabled={loading || !formData.monto || !formData.cuentaId}
                className="btn-submit"
              >
                {loading ? 'Procesando...' : `Retirar ${monedaSeleccionada?.simbolo}${parseFloat(formData.monto || 0).toFixed(2)}`}
              </button>
            </form>
          )}
          {/* Bloque de retiro cripto */}
          <div className="retiro-cripto-section" style={{marginTop: 32, marginBottom: 32}}>
            <h3 style={{marginBottom: 8}}>Retiro vía Crypto Wallet</h3>
            <p style={{marginBottom: 16}}>Puedes retirar fondos a tu wallet cripto registrada. Usa tu ID wallet único para recibir transferencias.</p>
            {usuario?.walletId ? (
              <div style={{textAlign: 'center', marginBottom: 24}}>
                <div style={{fontWeight: 'bold', fontSize: 16, marginBottom: 8}}>Tu ID Wallet:</div>
                <div style={{display: 'inline-flex', alignItems: 'center', background: '#f3f3f3', borderRadius: 8, padding: '8px 16px', fontSize: 15, letterSpacing: 1}}>
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
              </div>
            ) : (
              <div style={{color: '#b00', fontWeight: 500, marginBottom: 16}}>No tienes una wallet cripto registrada. Solicítala al soporte.</div>
            )}
            <CryptoForm tipo="retirar" token={localStorage.getItem('token')} />
          </div>
        </div>
      </div>

      {/* Historial */}
      <div className="historial-card">
        <div className="retiros-toggle">
          <button
            type="button"
            className={`retiros-toggle-btn ${historialOpen ? 'open' : ''}`}
            onClick={() => setHistorialOpen((prev) => !prev)}
          >
            Ultimos retiros
            <span className="retiros-toggle-icon">{historialOpen ? '−' : '+'}</span>
          </button>
        </div>
        <div className={`retiros-section ${historialOpen ? 'open' : 'collapsed'}`}>
          <h3>Últimos Retiros</h3>
          <div className="historial-tabla">
            {retirosLoading ? (
              <div className="loading-spinner">Cargando historial...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Monto</th>
                    <th>Moneda</th>
                    <th>Cuenta</th>
                    <th>Estado</th>
                    <th>Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {retiros.length === 0 ? (
                    <tr>
                      <td colSpan="5">No hay retiros registrados</td>
                    </tr>
                  ) : (
                    retiros.map((r) => (
                      <tr key={r.id}>
                        <td>{r.monto}</td>
                        <td>{r.descripcion?.split(' - ')[1] || '-'}</td>
                        <td>{r.numeroTarjeta ? `****${r.numeroTarjeta}` : '-'}</td>
                        <td>{r.estado}</td>
                        <td>{r.numeroReferencia}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
