const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BankAccount = sequelize.define('BankAccount', {
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
  bankAccountToken: {
    type: DataTypes.STRING,
    allowNull: true, // Token de Stripe o NULL para bancos RD
    unique: false,
  },
  nombreCuenta: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  numerosCuenta: {
    type: DataTypes.STRING, // Últimos 4 dígitos
    allowNull: false,
  },
  banco: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tipoCuenta: {
    type: DataTypes.ENUM('ahorros', 'corriente', 'otro'),
    defaultValue: 'ahorros',
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'verificada', 'fallida', 'bloqueada'),
    defaultValue: 'pendiente',
  },
  // Microdeposits para verificación
  deposit1: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  deposit2: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  deposit1Verificado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deposit2Verificado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  intentosFallidos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  stripeBankAccountId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  esDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
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
  tableName: 'BankAccounts',
  timestamps: true,
});

module.exports = BankAccount;
