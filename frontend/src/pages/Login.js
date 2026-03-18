import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import GoogleAuthButton from '../components/GoogleAuthButton';
import './Auth.css';

const PENDING_GOOGLE_REGISTRATION_KEY = 'pendingGoogleRegistration';
const GOOGLE_CONFIG_RETRY_DELAYS = [0, 1500, 4000];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const { login, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  useEffect(() => {
    let mounted = true;

    const cargarGoogleConfig = async () => {
      for (const delayMs of GOOGLE_CONFIG_RETRY_DELAYS) {
        if (delayMs > 0) {
          await wait(delayMs);
        }

        try {
          const response = await authAPI.getGoogleConfig();
          if (mounted) {
            setGoogleClientId(response.data?.clientId || '');
          }
          return;
        } catch (configError) {
          if (!mounted) {
            return;
          }
        }
      }

      if (mounted) {
        setGoogleClientId('');
      }
    };

    const handleOnline = () => {
      cargarGoogleConfig();
    };

    cargarGoogleConfig();
    window.addEventListener('online', handleOnline);
    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      // Ejecutar reCAPTCHA
      if (!executeRecaptcha) {
        throw new Error('reCAPTCHA no está disponible');
      }

      const recaptchaToken = await executeRecaptcha('login');
      
      // Enviar login con token de reCAPTCHA
      await login(email, password, recaptchaToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message || 'Error en el login');
    } finally {
      setLoading(false);
    }
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

  const handleGoogleCredential = async (credential) => {
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const response = await loginWithGoogle(credential);

      if (response?.registroRequerido) {
        sessionStorage.setItem(PENDING_GOOGLE_REGISTRATION_KEY, JSON.stringify({
          googleFlow: true,
          googleRegistrationToken: response.googleRegistrationToken,
          prefill: response.prefill,
        }));
        navigate('/register', {
          state: {
            googleFlow: true,
            googleRegistrationToken: response.googleRegistrationToken,
            prefill: response.prefill,
          },
        });
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message || 'Error con Google Sign-In');
    } finally {
      setLoading(false);
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

          <div className="recaptcha-notice">
            Este sitio está protegido por reCAPTCHA y se aplican la
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"> Política de Privacidad</a> y
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer"> Términos de Servicio</a> de Google.
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ display: 'grid', gap: '14px', marginTop: '18px' }}>
          <div style={{ textAlign: 'center', fontSize: '0.92rem', color: '#6b7280' }}>o continúa con</div>
          {googleClientId ? (
            <GoogleAuthButton
              clientId={googleClientId}
              onCredential={handleGoogleCredential}
              disabled={loading}
            />
          ) : (
            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#6b7280' }}>
              Google Sign-In no está disponible ahora mismo.
            </div>
          )}
        </div>

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
  const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

  if (!recaptchaSiteKey) {
    console.error('⚠️ reCAPTCHA Site Key no está configurado');
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ color: '#e53e3e' }}>
          <h2>⚠️ Error de Configuración</h2>
          <p>reCAPTCHA no está configurado correctamente. Por favor, contacta al administrador.</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey} useRecaptchaNet>
      <LoginContent />
    </GoogleReCaptchaProvider>
  );
}
