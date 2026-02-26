const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FondoRiesgo = sequelize.define('FondoRiesgo', {
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
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Monto invertido en el fondo de riesgo',
  },
  porcentaje: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    comment: 'Porcentaje de inversión',
  },
  fechaRegistro: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Fecha de registro de la inversión',
  },
  fechaGanancia: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de registro de ganancias',
  },
  crecimiento: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Crecimiento del fondo',
  }
});

module.exports = FondoRiesgo;
