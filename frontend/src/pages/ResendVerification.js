import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Auth.css';

export default function ResendVerification() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.resendVerification(email);
      setMessage(response.data?.mensaje || 'Se envió un nuevo correo de verificación. Revisa tu bandeja de entrada y spam.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo reenviar la verificación. Verifica que el email sea correcto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reenviar Verificación</h1>
          <p>¿No recibiste el correo de verificación?</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              autoComplete="username"
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Reenviar correo'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/login">Volver a iniciar sesión</Link>
          </p>
          <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
            <strong>Nota:</strong> Revisa tu carpeta de spam. El correo puede tardar unos minutos en llegar.
          </p>
        </div>
      </div>
    </div>
  );
}
