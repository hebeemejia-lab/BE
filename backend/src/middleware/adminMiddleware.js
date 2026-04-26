const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ADMIN_SAFE_USER_ATTRIBUTES = [
  'id',
  'nombre',
  'apellido',
  'email',
  'emailVerificado',
  'rol',
];

const verificarAdmin = async (req, res, next) => {
  try {
    // Verificar que existe el token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Acceso denegado. Token no proporcionado.' 
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar el usuario
    const usuario = await User.findByPk(decoded.id, {
      attributes: ADMIN_SAFE_USER_ATTRIBUTES,
    });
    
    if (!usuario) {
      return res.status(401).json({ 
        error: 'Usuario no encontrado.' 
      });
    }

    // Verificar que sea admin o admin_lite
    const rolesPermitidos = new Set(['admin', 'admin_lite']);
    if (!rolesPermitidos.has(usuario.rol)) {
      return res.status(403).json({ 
        error: 'Acceso denegado. Se requieren privilegios de administrador.' 
      });
    }

    // Agregar usuario a la request
    req.usuario = usuario;
    next();
  } catch (error) {
    console.error('Error en verificación admin:', error);

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

module.exports = verificarAdmin;
