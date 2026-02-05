const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inversion = sequelize.define('Inversion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id',
    },
  },
  symbol: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Ticker de la acción (AAPL, TSLA, etc.)',
  },
  cantidad: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    comment: 'Cantidad de acciones',
  },
  precioCompra: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Precio por acción al comprar',
  },
  costoTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Precio total pagado (cantidad * precioCompra)',
  },
  precioVenta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Precio por acción al vender',
  },
  ingresoTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Dinero recibido al vender (cantidad * precioVenta)',
  },
  ganancia: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Ganancia/pérdida (ingresoTotal - costoTotal)',
  },
  estado: {
    type: DataTypes.ENUM('abierta', 'cerrada'),
    allowNull: false,
    defaultValue: 'abierta',
    comment: 'Estado de la posición',
  },
  tipo: {
    type: DataTypes.ENUM('compra', 'venta'),
    allowNull: false,
    defaultValue: 'compra',
  },
  fechaCompra: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fechaVenta: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'inversiones',
  timestamps: true,
  indexes: [
    {
      fields: ['usuarioId'],
    },
    {
      fields: ['symbol'],
    },
    {
      fields: ['estado'],
    },
  ],
});

module.exports = Inversion;
