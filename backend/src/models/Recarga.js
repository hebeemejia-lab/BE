const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Recarga = sequelize.define('Recarga', {
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
  montoNeto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  comision: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  metodo: {
    type: DataTypes.ENUM('tarjeta', 'transferencia', 'codigo', 'paypal', 'rapyd', '2checkout'),
    defaultValue: 'tarjeta',
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'procesando', 'exitosa', 'fallida', 'reembolsada'),
    defaultValue: 'pendiente',
  },
  stripePaymentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  stripeChargeId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rapydCheckoutId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rapydCheckoutUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paypalOrderId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paypalCaptureId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  numeroReferencia: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  numeroTarjeta: {
    type: DataTypes.STRING, // Últimos 4 dígitos
    allowNull: true,
  },
  mensajeError: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fechaProcesamiento: {
    type: DataTypes.DATE,
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
  tableName: 'Recargas',
  timestamps: true,
});

module.exports = Recarga;
