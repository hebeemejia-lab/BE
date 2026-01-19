const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Registrar usuario
const register = async (req, res) => {
  try {
    const { nombre, email, password, cedula, telefono, direccion, saldo } = req.body;

    if (!nombre || !email || !password || !cedula || !telefono || !direccion) {
      return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
    }

    const usuarioExistente = await User.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    const nuevoUsuario = await User.create({
      nombre,
      email,
      password,
      cedula,
      telefono,
      direccion,
      saldo: saldo || 0,
    });

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
        email: nuevoUsuario.email,
        saldo: parseFloat(nuevoUsuario.saldo),
      },
      token,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: error.message });
  }
};

// Login usuario
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Email y contraseña requeridos' });
    }

    const usuario = await User.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    const esValida = await usuario.comparePassword(password);
    if (!esValida) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

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
      },
      token,
    });
  } catch (error) {
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

module.exports = { register, login, getPerfil };
