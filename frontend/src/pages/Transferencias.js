import React, { useState, useContext } from 'react';
import { transferAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Transferencias.css';

export default function Transferencias() {
  const [modo, setModo] = useState('cedula'); // 'cedula' | 'wallet'
  const [cedula, setCedula] = useState('');
  const [walletDest, setWalletDest] = useState('');
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { usuario } = useContext(AuthContext);

  // Wallet ID propio: BE-XXXXXX basado en el ID numérico del usuario
  const miWalletId = usuario?.id
    ? `BE-${String(usuario.id).padStart(6, '0')}`
    : '—';

  const handleCopyWallet = () => {
    if (miWalletId !== '—') {
      navigator.clipboard.writeText(miWalletId).catch(() => {});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        monto: parseFloat(monto),
        concepto,
      };
      if (modo === 'wallet') {
        payload.wallet_id = walletDest.trim();
      } else {
        payload.cedula_destinatario = cedula.trim();
      }

      await transferAPI.realizar(payload);

      setSuccess(`Transferencia de $${monto} realizada exitosamente`);
      setCedula('');
      setWalletDest('');
      setMonto('');
      setConcepto('');

      if (usuario) usuario.saldo -= parseFloat(monto);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error en la transferencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tr-container">
      <div className="tr-header">
        <h1 className="tr-title">Transferencias</h1>
        <p className="tr-subtitle">Envía dinero de forma segura e inmediata</p>
      </div>

      {/* Tu ID de Wallet */}
      <div className="tr-wallet-id-card">
        <div className="tr-wid-left">
          <span className="tr-wid-label">Tu ID de Wallet</span>
          <span className="tr-wid-value" aria-label={`Tu ID de wallet es ${miWalletId}`}>{miWalletId}</span>
          <span className="tr-wid-hint">Comparte este ID para recibir transferencias desde cualquier plataforma</span>
        </div>
        <button
          className="tr-wid-copy"
          onClick={handleCopyWallet}
          aria-label="Copiar tu ID de wallet"
          title="Copiar ID"
        >
          📋 Copiar
        </button>
      </div>

      <div className="tr-content">
        <div className="tr-form-card">
          <h2 className="tr-form-title">Nueva transferencia</h2>

          {error   && <div className="tr-error"   role="alert">{error}</div>}
          {success && <div className="tr-success"  role="status">{success}</div>}

          {/* Modo selector */}
          <div className="tr-mode-tabs" role="group" aria-label="Método de transferencia">
            <button
              type="button"
              className={`tr-mode-tab ${modo === 'cedula' ? 'tr-mode-tab--active' : ''}`}
              onClick={() => setModo('cedula')}
              aria-pressed={modo === 'cedula'}
            >
              🪪 Por cédula
            </button>
            <button
              type="button"
              className={`tr-mode-tab ${modo === 'wallet' ? 'tr-mode-tab--active' : ''}`}
              onClick={() => setModo('wallet')}
              aria-pressed={modo === 'wallet'}
            >
              💼 Por ID de wallet
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {modo === 'cedula' ? (
              <div className="tr-field">
                <label className="tr-label" htmlFor="cedula-input">Cédula del destinatario</label>
                <input
                  id="cedula-input"
                  className="tr-input"
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  required
                  placeholder="Ej: 001-1234567-8"
                  autoComplete="off"
                />
              </div>
            ) : (
              <div className="tr-field">
                <label className="tr-label" htmlFor="wallet-input">ID de wallet del destinatario</label>
                <input
                  id="wallet-input"
                  className="tr-input tr-input--wallet"
                  type="text"
                  value={walletDest}
                  onChange={(e) => setWalletDest(e.target.value)}
                  required
                  placeholder="BE-000001"
                  autoComplete="off"
                />
                <span className="tr-field-hint">Formato: BE-XXXXXX</span>
              </div>
            )}

            <div className="tr-field">
              <label className="tr-label" htmlFor="monto-input">Monto a transferir</label>
              <div className="tr-input-wrap">
                <span className="tr-currency" aria-hidden="true">$</span>
                <input
                  id="monto-input"
                  className="tr-input tr-input--amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="tr-field">
              <label className="tr-label" htmlFor="concepto-input">Concepto <span className="tr-optional">(opcional)</span></label>
              <input
                id="concepto-input"
                className="tr-input"
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej: Pago de servicios"
              />
            </div>

            <div className="tr-balance-info" aria-label="Tu saldo disponible">
              <span>Saldo disponible:</span>
              <strong>${Number(usuario?.saldo || 0).toFixed(2)}</strong>
            </div>

            <button type="submit" className="tr-btn-submit" disabled={loading}>
              {loading ? 'Procesando...' : '💸 Realizar transferencia'}
            </button>
          </form>
        </div>

        <div className="tr-info-card">
          <h3 className="tr-info-title">Información importante</h3>
          <ul className="tr-info-list">
            <li>✓ Transferencias inmediatas</li>
            <li>✓ Sin comisiones bancarias</li>
            <li>✓ Seguras y encriptadas</li>
            <li>✓ Disponible 24/7</li>
            <li>✓ Usa cédula o ID de wallet BE-XXXXXX</li>
            <li>✓ Compatible con cualquier cuenta Banco Exclusivo</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
