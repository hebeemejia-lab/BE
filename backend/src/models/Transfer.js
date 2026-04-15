const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transfer = sequelize.define('Transfer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    remitenteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    destinatarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    monto: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    concepto: {
      type: DataTypes.STRING,
      defaultValue: 'Transferencia bancaria',
    },
    estado: {
      type: DataTypes.ENUM('exitosa', 'pendiente', 'rechazada'),
      defaultValue: 'exitosa',
    },
  }, {
    timestamps: true,
  });
  return Transfer;
};
