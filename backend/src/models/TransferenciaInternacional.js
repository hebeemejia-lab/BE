const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TransferenciaInternacional = sequelize.define('TransferenciaInternacional', {
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
  paisDestino: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  monedaDestino: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  monto: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  nombreBeneficiario: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  apellidoBeneficiario: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  emailBeneficiario: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telefonoBeneficiario: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  numeroCuenta: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  codigoBanco: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  metodoPago: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'bank',
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pendiente',
  },
  rapydPayoutId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rapydBeneficiaryId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'TransferenciasInternacionales',
});

module.exports = TransferenciaInternacional;
