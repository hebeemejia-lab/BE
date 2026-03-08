const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CirculoAhorro = sequelize.define('CirculoAhorro', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.STRING },
  montoAporte: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  miembrosMax: { type: DataTypes.INTEGER, allowNull: false },
  estado: { type: DataTypes.ENUM('activo', 'finalizado'), defaultValue: 'activo' },
}, {
  timestamps: true,
});

module.exports = CirculoAhorro;