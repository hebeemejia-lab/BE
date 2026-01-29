// Actualizar perfil del usuario autenticado
const updatePerfil = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    const { nombre, apellido, email } = req.body;
    if (nombre) usuario.nombre = nombre;
    if (apellido) usuario.apellido = apellido;
    if (email) usuario.email = email;
    await usuario.save();
    res.json({
      mensaje: 'Perfil actualizado',
      usuario: {
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
const User = require('../models/User');

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

    const nuevoUsuario = await User.create({
      nombre,
      apellido,
      email,
      password,
      cedula,
      telefono,
      direccion,
      saldo: saldo || 0,
    });

    console.log('✅ Usuario creado:', nuevoUsuario.id);

    const token = jwt.sign(
      { id: nuevoUsuario.id, email: nuevoUsuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        apellido: nuevoUsuario.apellido,
        email: nuevoUsuario.email,
        saldo: parseFloat(nuevoUsuario.saldo),
      },
      token,
    });
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
      },
      token,
    });
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    res.status(500).json({ error: error.message });
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

module.exports = { register, login, getPerfil, updatePerfil };
