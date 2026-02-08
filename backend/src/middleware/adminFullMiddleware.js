const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verificarAdminFull = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Acceso denegado. Token no proporcionado.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await User.findByPk(decoded.id);

    if (!usuario) {
      return res.status(401).json({
        error: 'Usuario no encontrado.'
      });
    }

    if (usuario.rol !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado. Se requiere rol admin completo.'
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    console.error('Error en verificación admin full:', error);
    return res.status(401).json({
      error: 'Token inválido o expirado.'
    });
  }
};

module.exports = verificarAdminFull;
