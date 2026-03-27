const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const { Op } = require('sequelize');
const User = require('../models/User');
const emailService = require('../services/emailService');

const GOOGLE_REGISTRATION_TOKEN_TTL = '30m';

// Lista de atributos compatible con esquemas de base de datos legacy
// para evitar errores cuando existen columnas en el modelo que aun no
// han sido migradas en el entorno remoto.
const AUTH_SAFE_USER_ATTRIBUTES = [
  'id',
  'nombre',
  'apellido',
  'email',
  'emailVerificado',
  'emailVerificationToken',
  'emailVerificationExpires',
  'password',
  'cedula',
  'telefono',
  'direccion',
  'saldo',
  'saldoChain',
  'rol',
];

const AUTH_CREATE_FIELDS = [
  'nombre',
  'apellido',
  'email',
  'password',
  'cedula',
  'telefono',
  'direccion',
  'saldo',
  'emailVerificado',
  'emailVerificationToken',
  'emailVerificationExpires',
  'rol',
];

const normalizarEmail = (email) => String(email || '').trim().toLowerCase();

const splitNombreCompleto = (fullName = '') => {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { nombre: '', apellido: '' };
  }

  if (parts.length === 1) {
    return { nombre: parts[0], apellido: '' };
  }

  return {
    nombre: parts[0],
    apellido: parts.slice(1).join(' '),
  };
};

const construirPayloadUsuario = (usuario) => ({
  id: usuario.id,
  nombre: usuario.nombre,
  apellido: usuario.apellido,
  email: usuario.email,
  saldo: parseFloat(usuario.saldo),
  saldoChain: parseFloat(usuario.saldoChain || 0),
  rol: usuario.rol || 'cliente',
  emailVerificado: usuario.emailVerificado,
});

const emitirTokenSesion = (usuario) => jwt.sign(
  { id: usuario.id, email: usuario.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' },
);

const perfilRegistroCompleto = (usuario) => Boolean(
  usuario?.nombre
  && usuario?.apellido
  && usuario?.email
  && usuario?.cedula
  && usuario?.telefono
  && usuario?.direccion,
);

const construirPrefillGoogle = (googleData, usuario = null) => {
  const fallbackNombre = splitNombreCompleto(googleData.name);

  return {
    nombre: usuario?.nombre || googleData.given_name || fallbackNombre.nombre || '',
    apellido: usuario?.apellido || googleData.family_name || fallbackNombre.apellido || '',
    email: usuario?.email || googleData.email || '',
    cedula: usuario?.cedula || '',
    telefono: usuario?.telefono || '',
    direccion: usuario?.direccion || '',
  };
};

const emitirGoogleRegistrationToken = (googleData) => jwt.sign(
  {
    tipo: 'google-registration',
    email: normalizarEmail(googleData.email),
    nombre: googleData.given_name || '',
    apellido: googleData.family_name || '',
    name: googleData.name || '',
    picture: googleData.picture || null,
  },
  process.env.JWT_SECRET,
  { expiresIn: GOOGLE_REGISTRATION_TOKEN_TTL },
);

const GOOGLE_TOKENINFO_ENDPOINTS = [
  'https://oauth2.googleapis.com/tokeninfo',
  'https://www.googleapis.com/oauth2/v3/tokeninfo',
];

const GOOGLE_VALIDATION_NETWORK_ERROR_CODES = new Set([
  'ECONNABORTED',
  'ECONNRESET',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EAI_AGAIN',
]);

const verificarGoogleIdToken = async (idToken) => {
  const token = String(idToken || '').trim();
  if (!token) {
    throw new Error('Credencial de Google requerida');
  }

  const configuredClientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  let lastError = null;
  let hadNetworkFailure = false;

  for (const endpoint of GOOGLE_TOKENINFO_ENDPOINTS) {
    try {
      const response = await axios.get(endpoint, {
        params: { id_token: token },
        timeout: 7000,
      });

      const googleData = response.data || {};
      const emailVerificado = googleData.email_verified === true || googleData.email_verified === 'true';
      const issuer = String(googleData.iss || '').trim();

      if (!googleData.email) {
        throw new Error('El token de Google no contiene email');
      }

      if (!emailVerificado) {
        throw new Error('La cuenta de Google no tiene un email verificado');
      }

      if (configuredClientId && String(googleData.aud || '').trim() !== configuredClientId) {
        throw new Error('El token de Google no pertenece a este cliente');
      }

      if (issuer && issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') {
        throw new Error('Emisor de token de Google inválido');
      }

      const exp = Number(googleData.exp);
      if (Number.isFinite(exp) && exp * 1000 < Date.now()) {
        throw new Error('El token de Google expiró');
      }

      return {
        ...googleData,
        email: normalizarEmail(googleData.email),
      };
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      const code = String(error?.code || '').toUpperCase();
      const isNetworkError = GOOGLE_VALIDATION_NETWORK_ERROR_CODES.has(code);

      if (isNetworkError) {
        hadNetworkFailure = true;
      }

      // Si el token es inválido para un endpoint, intentar el siguiente
      // y devolver el último error al final.
      console.warn(`⚠️ Falló validación con ${endpoint}:`, error.message, status ? `(status ${status})` : '');
    }
  }

  if (hadNetworkFailure && !lastError?.response) {
    const networkError = new Error('No se pudo contactar a Google para validar la cuenta');
    networkError.code = 'GOOGLE_VALIDATION_UNAVAILABLE';
    throw networkError;
  }

  throw lastError || new Error('No se pudo validar la cuenta de Google');
};

// Registrar usuario

const register = async (req, res) => {
  try {
    const { nombre, apellido, email, password, cedula, telefono, direccion, saldo } = req.body || {};
    const emailNormalizado = normalizarEmail(email);

    console.log('📝 Registro - Datos recibidos:', {
      nombre,
      apellido,
      email: emailNormalizado,
      cedula,
      telefono,
      direccion,
    });

    if (!nombre || !apellido || !emailNormalizado || !password || !cedula || !telefono || !direccion) {
      console.warn('⚠️ Registro - Faltan campos requeridos');
      return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
    }

    const usuarioExistente = await User.findOne({
      where: { email: emailNormalizado },
      attributes: ['id', 'email'],
    });
    if (usuarioExistente) {
      console.warn('⚠️ Registro - Email ya registrado:', emailNormalizado);
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    // Verificar si la cédula ya existe
    const cedulaExistente = await User.findOne({
      where: { cedula },
      attributes: ['id', 'cedula'],
    });
    if (cedulaExistente) {
      console.warn('⚠️ Registro - Cédula ya registrada:', cedula);
      return res.status(400).json({ mensaje: 'La cédula ya está registrada' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const nuevoUsuario = await User.create({
      nombre,
      apellido,
      email: emailNormalizado,
      password,
      cedula,
      telefono,
      direccion,
      saldo: saldo || 0,
      emailVerificado: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    }, {
      fields: AUTH_CREATE_FIELDS,
    });

    console.log('✅ Usuario creado:', nuevoUsuario.id);

    // Intentar enviar email de verificación
    const resultadoEmail = await emailService.enviarVerificacionEmail(nuevoUsuario, verificationToken);
    
    console.log('📧 Resultado envío email:', resultadoEmail);

    // Responder según si el email se envió o no
    if (resultadoEmail.enviado) {
      res.status(201).json({
        mensaje: 'Usuario registrado. Revisa tu correo para verificar tu cuenta.',
        requiereVerificacion: true,
        emailEnviado: true,
        usuario: {
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          apellido: nuevoUsuario.apellido,
          email: nuevoUsuario.email,
          saldo: parseFloat(nuevoUsuario.saldo),
          emailVerificado: false,
        },
      });
    } else {
      console.warn('⚠️ Email no enviado, pero usuario creado');
      res.status(201).json({
        mensaje: 'Usuario registrado. Sin embargo, hubo un problema al enviar el email de verificación. Puedes reenviar la verificación desde tu perfil.',
        requiereVerificacion: true,
        emailEnviado: false,
        errorEmail: resultadoEmail.error || 'Error al enviar email',
        verifyUrl: resultadoEmail.verifyUrl, // Para debugging en desarrollo
        usuario: {
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          apellido: nuevoUsuario.apellido,
          email: nuevoUsuario.email,
          saldo: parseFloat(nuevoUsuario.saldo),
          emailVerificado: false,
        },
      });
    }
  } catch (error) {
    console.error('❌ Error en registro:', error.message);
    console.error('📋 Stack:', error.stack);
    res.status(500).json({ error: error.message, detalle: 'Ver logs del servidor' });
  }
};

const getGoogleConfig = async (req, res) => {
  const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();

  if (!clientId) {
    return res.status(503).json({
      mensaje: 'Google Sign-In no está configurado',
      enabled: false,
    });
  }

  return res.json({
    enabled: true,
    clientId,
  });
};

const loginConGoogle = async (req, res) => {
  try {
    const { credential } = req.body || {};
    const googleData = await verificarGoogleIdToken(credential);
    const email = normalizarEmail(googleData.email);
    const usuario = await User.findOne({
      where: { email },
      attributes: AUTH_SAFE_USER_ATTRIBUTES,
    });

    if (!usuario) {
      return res.json({
        mensaje: 'Completa tu registro para terminar de vincular Google.',
        registroRequerido: true,
        googleRegistrationToken: emitirGoogleRegistrationToken(googleData),
        prefill: construirPrefillGoogle(googleData),
      });
    }

    if (!perfilRegistroCompleto(usuario)) {
      return res.json({
        mensaje: 'Completa los datos faltantes de tu cuenta para usar Google.',
        registroRequerido: true,
        googleRegistrationToken: emitirGoogleRegistrationToken(googleData),
        prefill: construirPrefillGoogle(googleData, usuario),
      });
    }

    if (!usuario.emailVerificado && usuario.rol !== 'admin') {
      usuario.emailVerificado = true;
      usuario.emailVerificationToken = null;
      usuario.emailVerificationExpires = null;
      await usuario.save();
    }

    const token = emitirTokenSesion(usuario);

    return res.json({
      mensaje: 'Inicio de sesión con Google exitoso',
      usuario: construirPayloadUsuario(usuario),
      token,
    });
  } catch (error) {
    console.error('❌ Error en login con Google:', error.message);

    if (error.code === 'GOOGLE_VALIDATION_UNAVAILABLE') {
      return res.status(503).json({
        mensaje: 'Google Sign-In temporalmente no disponible. Intenta nuevamente en unos minutos.',
        error: error.message,
      });
    }

    return res.status(400).json({
      mensaje: 'No se pudo validar la cuenta de Google',
      error: error.message,
    });
  }
};

const completarRegistroConGoogle = async (req, res) => {
  try {
    const {
      googleRegistrationToken,
      nombre,
      apellido,
      email,
      password,
      cedula,
      telefono,
      direccion,
      saldo,
    } = req.body || {};

    if (!googleRegistrationToken) {
      return res.status(400).json({ mensaje: 'googleRegistrationToken requerido' });
    }

    let googlePayload;
    try {
      googlePayload = jwt.verify(googleRegistrationToken, process.env.JWT_SECRET);
    } catch (tokenError) {
      return res.status(400).json({ mensaje: 'La sesión de Google expiró. Inicia con Google nuevamente.' });
    }

    if (googlePayload.tipo !== 'google-registration') {
      return res.status(400).json({ mensaje: 'Token de registro de Google inválido' });
    }

    const emailNormalizado = normalizarEmail(email || googlePayload.email);
    if (!emailNormalizado || emailNormalizado !== normalizarEmail(googlePayload.email)) {
      return res.status(400).json({ mensaje: 'El email debe coincidir con la cuenta de Google' });
    }

    if (!nombre || !apellido || !cedula || !telefono || !direccion) {
      return res.status(400).json({ mensaje: 'Todos los campos del registro son requeridos' });
    }

    let usuario = await User.findOne({
      where: { email: emailNormalizado },
      attributes: AUTH_SAFE_USER_ATTRIBUTES,
    });
    const cedulaExistente = await User.findOne({
      where: {
        cedula,
        ...(usuario ? { id: { [Op.ne]: usuario.id } } : {}),
      },
      attributes: ['id', 'cedula'],
    });

    if (cedulaExistente) {
      return res.status(400).json({ mensaje: 'La cédula ya está registrada' });
    }

    if (usuario) {
      usuario.nombre = nombre;
      usuario.apellido = apellido;
      usuario.cedula = cedula;
      usuario.telefono = telefono;
      usuario.direccion = direccion;
      usuario.emailVerificado = true;
      usuario.emailVerificationToken = null;
      usuario.emailVerificationExpires = null;
      await usuario.save();
    } else {
      if (!password) {
        return res.status(400).json({ mensaje: 'Debes crear una contraseña para completar tu registro' });
      }

      usuario = await User.create({
        nombre,
        apellido,
        email: emailNormalizado,
        password,
        cedula,
        telefono,
        direccion,
        saldo: saldo || 0,
        emailVerificado: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      }, {
        fields: AUTH_CREATE_FIELDS,
      });
    }

    const token = emitirTokenSesion(usuario);

    return res.status(201).json({
      mensaje: 'Cuenta vinculada con Google exitosamente',
      usuario: construirPayloadUsuario(usuario),
      token,
    });
  } catch (error) {
    console.error('❌ Error completando registro con Google:', error.message);
    return res.status(500).json({
      mensaje: 'No se pudo completar el registro con Google',
      error: error.message,
    });
  }
};

// Login usuario
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const emailNormalizado = normalizarEmail(email);

    console.log('🔐 Login - Email:', emailNormalizado);

    if (!emailNormalizado || !password) {
      console.warn('⚠️ Login - Faltan email o contraseña');
      return res.status(400).json({ mensaje: 'Email y contraseña requeridos' });
    }

    const usuario = await User.findOne({
      where: { email: emailNormalizado },
      attributes: AUTH_SAFE_USER_ATTRIBUTES,
    });
    if (!usuario) {
      console.warn('⚠️ Login - Usuario no encontrado:', emailNormalizado);
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    if (!usuario.emailVerificado && usuario.rol !== 'admin') {
      console.warn('⚠️ Login - Email no verificado:', emailNormalizado);
      return res.status(403).json({ mensaje: 'Verifica tu correo antes de iniciar sesión' });
    }

    const esValida = await usuario.comparePassword(password);
    if (!esValida) {
      console.warn('⚠️ Login - Contraseña incorrecta para:', emailNormalizado);
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    console.log('✅ Login exitoso:', emailNormalizado);

    const token = emitirTokenSesion(usuario);

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: construirPayloadUsuario(usuario),
      token,
    });
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    res.status(500).json({
      mensaje: 'Error interno al iniciar sesión',
      error: error.message,
    });
  }
};

// Actualizar perfil del usuario autenticado
const updatePerfil = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.usuario.id, {
      attributes: AUTH_SAFE_USER_ATTRIBUTES,
    });
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    const { nombre, apellido, email } = req.body || {};
    if (nombre) usuario.nombre = nombre;
    if (apellido) usuario.apellido = apellido;
    if (email) usuario.email = normalizarEmail(email);
    await usuario.save();
    res.json({
      mensaje: 'Perfil actualizado',
      usuario: construirPayloadUsuario(usuario),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verificar email
const verifyEmail = async (req, res) => {
  try {
    const token = req.query?.token || req.body?.token;

    if (!token) {
      return res.status(400).json({ mensaje: 'Token de verificación requerido' });
    }

    const usuario = await User.findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { [Op.gt]: new Date() },
      },
      attributes: AUTH_SAFE_USER_ATTRIBUTES,
    });

    if (!usuario) {
      return res.status(400).json({ mensaje: 'Token inválido o expirado' });
    }

    usuario.emailVerificado = true;
    usuario.emailVerificationToken = null;
    usuario.emailVerificationExpires = null;
    await usuario.save();

    return res.json({ mensaje: 'Email verificado exitosamente' });
  } catch (error) {
    console.error('❌ Error verificando email:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Reenviar verificación
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body || {};
    const emailNormalizado = normalizarEmail(email);

    if (!emailNormalizado) {
      return res.status(400).json({ mensaje: 'Email requerido' });
    }

    const usuario = await User.findOne({
      where: { email: emailNormalizado },
      attributes: AUTH_SAFE_USER_ATTRIBUTES,
    });

    if (!usuario) {
      return res.json({ mensaje: 'Si el email existe, se enviará un enlace de verificación' });
    }

    if (usuario.emailVerificado) {
      return res.json({ mensaje: 'El email ya está verificado' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    usuario.emailVerificationToken = verificationToken;
    usuario.emailVerificationExpires = verificationExpires;
    await usuario.save();

    await emailService.enviarVerificacionEmail(usuario, verificationToken);

    return res.json({ mensaje: 'Se envió un nuevo enlace de verificación' });
  } catch (error) {
    console.error('❌ Error reenviando verificación:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Obtener perfil del usuario autenticado
const getPerfil = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.usuario.id, {
      attributes: AUTH_SAFE_USER_ATTRIBUTES.filter((attr) => attr !== 'password'),
    });
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  getGoogleConfig,
  loginConGoogle,
  completarRegistroConGoogle,
  getPerfil,
  updatePerfil,
  verifyEmail,
  resendVerification,
};
