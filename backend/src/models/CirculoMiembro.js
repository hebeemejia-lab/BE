const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const CirculoAhorro = require('./CirculoAhorro');

const CirculoMiembro = sequelize.define('CirculoMiembro', {
  rol: { type: DataTypes.ENUM('miembro', 'admin'), defaultValue: 'miembro' },
  turno: { type: DataTypes.INTEGER },
  aportado: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  retirado: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
}, {
  timestamps: true,
});

User.belongsToMany(CirculoAhorro, { through: CirculoMiembro, foreignKey: 'userId' });
CirculoAhorro.belongsToMany(User, { through: CirculoMiembro, foreignKey: 'circuloId' });

module.exports = CirculoMiembro;