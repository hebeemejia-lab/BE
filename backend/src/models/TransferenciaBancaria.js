const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TransferenciaBancaria = sequelize.define('TransferenciaBancaria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  nombreCuenta: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  numeroCuenta: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  banco: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tipoCuenta: {
    type: DataTypes.ENUM('ahorros', 'corriente'),
    defaultValue: 'ahorros',
  },
  concepto: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  stripePaymentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'procesando', 'exitosa', 'fallida', 'rechazada'),
    defaultValue: 'pendiente',
  },
  codigoReferencia: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mensajeError: {
    type: DataTypes.TEXT,
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
  tableName: 'TransferenciasBancarias',
  timestamps: true,
});

module.exports = TransferenciaBancaria;
