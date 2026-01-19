const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Loan = sequelize.define('Loan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  montoSolicitado: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  tasaInteres: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 5,
  },
  plazo: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado', 'completado'),
    defaultValue: 'pendiente',
  },
  montoAprobado: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: null,
  },
  motivoRechazo: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  cuotas: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  // Información bancaria
  bancoDespositante: {
    type: DataTypes.STRING,
    defaultValue: 'Banco Barenvas',
  },
  cuentaBancaria: {
    type: DataTypes.STRING,
    defaultValue: '9608141071',
  },
  emailAprobacion: {
    type: DataTypes.STRING,
    defaultValue: 'Hebelmejia2@gmail.com',
  },
  fechaAprobacion: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  numeroReferencia: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
}, {
  timestamps: true,
});

module.exports = Loan;
