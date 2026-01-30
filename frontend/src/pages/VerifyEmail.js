import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Auth.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verificando tu correo...');
  const [email, setEmail] = useState('');
  const [resendInfo, setResendInfo] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación inválido.');
      return;
    }

    authAPI
      .verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Tu correo fue verificado con éxito. Ya puedes iniciar sesión.');
      })
      .catch((err) => {
        const apiMessage = err.response?.data?.mensaje || 'No se pudo verificar el correo.';
        setStatus('error');
        setMessage(apiMessage);
      });
  }, [searchParams]);

  const handleResendVerification = async () => {
    setResendInfo('');
    if (!email) {
      setResendInfo('Por favor ingresa tu email');
      return;
    }

    try {
      const response = await authAPI.resendVerification(email);
      setResendInfo(response.data?.mensaje || 'Se envió un nuevo correo de verificación');
    } catch (err) {
      setResendInfo(err.response?.data?.mensaje || 'Error al reenviar');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Verificación de correo</h1>
          <p>Banco Exclusivo</p>
        </div>

        {status === 'loading' && <div className="success-message">{message}</div>}
        {status === 'success' && <div className="success-message">{message}</div>}
        {status === 'error' && (
          <>
            <div className="error-message">{message}</div>
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>¿No recibiste el correo?</h3>
              <div className="form-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={{ marginBottom: '10px' }}
                />
              </div>
              <button 
                type="button" 
                className="btn-submit" 
                onClick={handleResendVerification}
                style={{ marginBottom: '10px' }}
              >
                Reenviar correo de verificación
              </button>
              {resendInfo && <div className="success-message" style={{ marginTop: '10px' }}>{resendInfo}</div>}
            </div>
          </>
        )}

        <div className="auth-footer">
          <p>
            <Link to="/login">Ir a iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
