const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comision = sequelize.define('Comision', {
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
  inversionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Inversions',
      key: 'id',
    },
  },
  tipo: {
    // 'compra' | 'venta'
    type: DataTypes.ENUM('compra', 'venta'),
    allowNull: false,
  },
  symbol: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  montoBase: {
    // USD value of the trade before commission
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  porcentaje: {
    // e.g. 1.5
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
  },
  montoComision: {
    // USD amount charged as commission
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  precioEjecutado: {
    type: DataTypes.DECIMAL(24, 8),
    allowNull: true,
  },
  cantidadCrypto: {
    type: DataTypes.DECIMAL(24, 8),
    allowNull: true,
  },
  bybitOrderId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'comisiones',
  timestamps: true,
});

module.exports = Comision;
