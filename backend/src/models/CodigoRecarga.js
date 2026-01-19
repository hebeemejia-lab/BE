const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CodigoRecarga = sequelize.define('CodigoRecarga', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    defaultValue: () => Math.random().toString(36).substring(2, 15).toUpperCase(),
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('activo', 'canjeado', 'expirado', 'invalidado'),
    defaultValue: 'activo',
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Si es null, nadie lo ha canjeado aún
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  fechaCanjeado: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fechaExpiracion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  descripcion: {
    type: DataTypes.STRING,
    defaultValue: 'Código de recarga',
  },
  createdBy: {
    type: DataTypes.INTEGER, // ID del admin que lo creó
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'CodigosRecarga',
  timestamps: true,
});

module.exports = CodigoRecarga;
