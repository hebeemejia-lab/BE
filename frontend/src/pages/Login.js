import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';

import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Auth.css';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '';

  // Log temporal para depuración de sitekey
  console.log('RECAPTCHA_SITE_KEY:', RECAPTCHA_SITE_KEY);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    if (!recaptchaToken) {
      setError('Por favor, completa el reCAPTCHA.');
      setLoading(false);
      return;
    }

    try {
      // Enviar login con reCAPTCHA
      await login(email, password, recaptchaToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message || 'Error en el login');
    } finally {
      setLoading(false);
    }
  };

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const handleResendVerification = async () => {
    setError('');
    setInfo('');
    if (!email) {
      setError('Ingresa tu email para reenviar la verificación');
      return;
    }

    try {
      const response = await authAPI.resendVerification(email);
      setInfo(response.data?.mensaje || 'Se envió un nuevo enlace de verificación');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo reenviar la verificación');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Iniciar Sesión</h1>
          <p>Accede a tu cuenta de Banco Exclusivo</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {info && <div className="success-message">{info}</div>}

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

          <div className="form-group">
            <label>Contraseña</label>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>reCAPTCHA</label>
            <div className="captcha-field">
              <ReCAPTCHA
                siteKey={RECAPTCHA_SITE_KEY}
                onVerify={(token) => handleRecaptchaChange(token)}
                onExpired={() => console.log('reCAPTCHA expired')}
              />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿No tienes cuenta? <a href="/register">Regístrate aquí</a></p>
          <p>
            ¿No recibiste el correo?{' '}
            <button type="button" className="link-button" onClick={handleResendVerification}>
              Reenviar verificación
            </button>
            {' o '}
            <a href="/reenviar-verificacion">ir a la página de reenvío</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return <LoginContent />;
}
