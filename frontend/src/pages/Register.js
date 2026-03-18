import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const PENDING_GOOGLE_REGISTRATION_KEY = 'pendingGoogleRegistration';

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    cedula: '',
    telefono: '',
    direccion: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleFlow, setGoogleFlow] = useState(false);
  const [googleRegistrationToken, setGoogleRegistrationToken] = useState('');
  const { register, completeGoogleRegistration } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const pendingFromSession = sessionStorage.getItem(PENDING_GOOGLE_REGISTRATION_KEY);
    const pending = location.state?.googleRegistrationToken
      ? location.state
      : (pendingFromSession ? JSON.parse(pendingFromSession) : null);

    if (!pending?.googleRegistrationToken) {
      return;
    }

    setGoogleFlow(true);
    setGoogleRegistrationToken(pending.googleRegistrationToken);
    setFormData((prev) => ({
      ...prev,
      nombre: pending.prefill?.nombre || prev.nombre,
      apellido: pending.prefill?.apellido || prev.apellido,
      email: pending.prefill?.email || prev.email,
      cedula: pending.prefill?.cedula || prev.cedula,
      telefono: pending.prefill?.telefono || prev.telefono,
      direccion: pending.prefill?.direccion || prev.direccion,
    }));
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = googleFlow
        ? await completeGoogleRegistration({
            ...formData,
            googleRegistrationToken,
          })
        : await register(formData);

      if (googleFlow) {
        sessionStorage.removeItem(PENDING_GOOGLE_REGISTRATION_KEY);
        navigate('/dashboard');
        return;
      }

      if (response?.requiereVerificacion) {
        if (response.emailEnviado) {
          setSuccess('✅ Registro exitoso! Te hemos enviado un correo de verificación. Revisa tu bandeja de entrada y carpeta de SPAM.');
        } else {
          setSuccess('Registro exitoso, pero no pudimos enviar el email de verificación.');
          setError(`Problema con el email: ${response.errorEmail || 'Error desconocido'}. Contacta a soporte: Hebelmejia2@gmail.com`);
          
          // Si hay verifyUrl en desarrollo, mostrarla
          if (response.verifyUrl) {
            console.log('🔗 Link de verificación:', response.verifyUrl);
          }
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{googleFlow ? 'Completar Registro con Google' : 'Crear Cuenta'}</h1>
          <p>{googleFlow ? 'Termina de vincular tu cuenta de Google con tus datos de Banco Exclusivo' : 'Únete a Banco Exclusivo hoy'}</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              placeholder="Juan"
            />
          </div>
          <div className="form-group">
            <label>Apellido</label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              required
              placeholder="Pérez"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="tu@email.com"
              readOnly={googleFlow}
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
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
            <label>Cédula de Identidad</label>
            <input
              type="text"
              name="cedula"
              value={formData.cedula}
              onChange={handleChange}
              required
              placeholder="123456789"
            />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              required
              placeholder="+1234567890"
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label>Dirección</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              required
              placeholder="Calle 123, Apartamento 456"
              autoComplete="street-address"
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Cargando...' : googleFlow ? 'Guardar y Entrar con Google' : 'Registrarse'}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿Ya tienes cuenta? <a href="/login">Inicia sesión aquí</a></p>
          {success && (
            <p style={{ marginTop: '10px' }}>
              ¿No lo recibiste?{' '}
              <a href="/reenviar-verificacion">Reenviar correo de verificación</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
