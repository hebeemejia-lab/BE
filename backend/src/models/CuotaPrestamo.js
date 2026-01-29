const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CuotaPrestamo = sequelize.define('CuotaPrestamo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  prestamoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID del préstamo al que pertenece'
  },
  numeroCuota: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Número de cuota (1, 2, 3...)'
  },
  montoCuota: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Monto de la cuota'
  },
  pagado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'true si está pagada, false si está pendiente'
  },
  fechaVencimiento: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Fecha límite de pago'
  },
  fechaPago: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha en que se pagó (null si no se ha pagado)'
  },
  metodoPago: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Efectivo, Transferencia, Tarjeta, etc.'
  },
  referenciaPago: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Número de referencia/comprobante'
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones del pago'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'cuotas_prestamos',
  timestamps: false,
  indexes: [
    { fields: ['prestamoId'] },
    { fields: ['pagado'] },
    { fields: ['fechaVencimiento'] }
  ]
});

module.exports = CuotaPrestamo;
