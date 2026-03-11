// Login con Google
const { OAuth2Client } = require('google-auth-library');

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ mensaje: 'Token de Google requerido' });
    }

    const client = new OAuth2Client();
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (err) {
      console.error('❌ Error verificando token de Google:', err.message);
      return res.status(401).json({ mensaje: 'Token de Google inválido' });
    }

    const payload = ticket.getPayload();
    const email = payload.email;
    const nombre = payload.given_name || '';
    const apellido = payload.family_name || '';
    if (!email) {
      return res.status(400).json({ mensaje: 'No se pudo obtener el email de Google' });
    }

    let usuario = await User.findOne({ where: { email } });
    if (!usuario) {
      // Crear usuario nuevo con email verificado
      usuario = await User.create({
        nombre,
        apellido,
        email,
        password: crypto.randomBytes(16).toString('hex'), // Contraseña aleatoria
        cedula: 'GOOGLE-' + Date.now(),
        telefono: '',
        direccion: '',
        saldo: 0,
        emailVerificado: true,
        rol: 'cliente',
      });
      console.log('✅ Usuario creado por Google:', usuario.id);
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      mensaje: 'Inicio de sesión con Google exitoso',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        saldo: parseFloat(usuario.saldo),
        rol: usuario.rol || 'cliente',
        emailVerificado: usuario.emailVerificado,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Error en googleLogin:', error.message);
    res.status(500).json({ error: error.message });
  }
};
// Actualizar perfil del usuario autenticado
const getPerfil = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.usuario.id, {
      attributes: { exclude: ['password'] },
    });
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
      usuario: {
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ mensaje: 'Token de Google requerido' });
    }

    const client = new OAuth2Client();
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (err) {
      console.error('❌ Error verificando token de Google:', err.message);
      return res.status(401).json({ mensaje: 'Token de Google inválido' });
    }

    const payload = ticket.getPayload();
    const email = payload.email;
    const nombre = payload.given_name || '';
    const apellido = payload.family_name || '';
    if (!email) {
      return res.status(400).json({ mensaje: 'No se pudo obtener el email de Google' });
    }

    let usuario = await User.findOne({ where: { email } });
    if (!usuario) {
      // Crear usuario nuevo con email verificado
      usuario = await User.create({
        nombre,
        apellido,
        email,
        password: crypto.randomBytes(16).toString('hex'), // Contraseña aleatoria
        cedula: 'GOOGLE-' + Date.now(),
        telefono: '',
        direccion: '',
        saldo: 0,
        emailVerificado: true,
        rol: 'cliente',
      });
      console.log('✅ Usuario creado por Google:', usuario.id);
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      mensaje: 'Inicio de sesión con Google exitoso',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        saldo: parseFloat(usuario.saldo),
        rol: usuario.rol || 'cliente',
        emailVerificado: usuario.emailVerificado,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Error en googleLogin:', error.message);
    res.status(500).json({ error: error.message });
  }
};
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        saldo: parseFloat(usuario.saldo),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const User = require('../models/User');
const emailService = require('../services/emailService');

// Registrar usuario
const register = async (req, res) => {
  try {
    const { nombre, apellido, email, password, cedula, telefono, direccion, saldo } = req.body;

    console.log('📝 Registro - Datos recibidos:', { nombre, apellido, email, cedula, telefono, direccion });

    if (!nombre || !apellido || !email || !password || !cedula || !telefono || !direccion) {
      console.warn('⚠️ Registro - Faltan campos requeridos');
      return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
    }

    const usuarioExistente = await User.findOne({ where: { email } });
    if (usuarioExistente) {
      console.warn('⚠️ Registro - Email ya registrado:', email);
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    // Verificar si la cédula ya existe
    const cedulaExistente = await User.findOne({ where: { cedula } });
    if (cedulaExistente) {
      console.warn('⚠️ Registro - Cédula ya registrada:', cedula);
      return res.status(400).json({ mensaje: 'La cédula ya está registrada' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const nuevoUsuario = await User.create({
      nombre,
      apellido,
      email,
      password,
      cedula,
      telefono,
      direccion,
      saldo: saldo || 0,
      emailVerificado: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
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

// Login usuario
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login - Email:', email);

    if (!email || !password) {
      console.warn('⚠️ Login - Faltan email o contraseña');
      return res.status(400).json({ mensaje: 'Email y contraseña requeridos' });
    }

    const usuario = await User.findOne({ where: { email } });
    if (!usuario) {
      console.warn('⚠️ Login - Usuario no encontrado:', email);
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    if (!usuario.emailVerificado && usuario.rol !== 'admin') {
      console.warn('⚠️ Login - Email no verificado:', email);
      return res.status(403).json({ mensaje: 'Verifica tu correo antes de iniciar sesión' });
    }

    const esValida = await usuario.comparePassword(password);
    if (!esValida) {
      console.warn('⚠️ Login - Contraseña incorrecta para:', email);
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    console.log('✅ Login exitoso:', email);

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        saldo: parseFloat(usuario.saldo),
        rol: usuario.rol || 'cliente',
        emailVerificado: usuario.emailVerificado,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Verificar email
const verifyEmail = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;

    if (!token) {
      return res.status(400).json({ mensaje: 'Token de verificación requerido' });
    }

    const usuario = await User.findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { [Op.gt]: new Date() },
      },
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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ mensaje: 'Email requerido' });
    }

    const usuario = await User.findOne({ where: { email } });

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
      attributes: { exclude: ['password'] },
    });
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login, getPerfil, updatePerfil, verifyEmail, resendVerification };
