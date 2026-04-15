const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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
        model: 'inversiones',
        key: 'id',
      },
    },
    tipo: {
      type: DataTypes.ENUM('compra', 'venta'),
      allowNull: false,
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    montoBase: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    porcentaje: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    montoComision: {
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
  return Comision;
};
