const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ADMIN_FULL_SAFE_USER_ATTRIBUTES = [
  'id',
  'email',
  'rol',
];

const verificarAdminFull = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Acceso denegado. Token no proporcionado.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await User.findByPk(decoded.id, {
      attributes: ADMIN_FULL_SAFE_USER_ATTRIBUTES,
    });

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

    if (error?.name && String(error.name).includes('Sequelize')) {
      return res.status(500).json({
        error: 'Error de base de datos al validar permisos de administrador.',
      });
    }

    return res.status(401).json({
      error: 'Token inválido o expirado.'
    });
  }
};

module.exports = verificarAdminFull;
