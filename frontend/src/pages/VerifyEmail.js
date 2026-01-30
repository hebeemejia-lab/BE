import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Auth.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verificando tu correo...');

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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Verificación de correo</h1>
          <p>Banco Exclusivo</p>
        </div>

        {status === 'loading' && <div className="success-message">{message}</div>}
        {status === 'success' && <div className="success-message">{message}</div>}
        {status === 'error' && <div className="error-message">{message}</div>}

        <div className="auth-footer">
          <p>
            <Link to="/login">Ir a iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
