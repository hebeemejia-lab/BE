'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inversiones', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      symbol: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      cantidad: {
        type: Sequelize.DECIMAL(24, 8),
        allowNull: false,
      },
      precioCompra: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      costoTotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      precioVenta: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      ingresoTotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      ganancia: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM('abierta', 'cerrada'),
        allowNull: false,
        defaultValue: 'abierta',
      },
      tipo: {
        type: Sequelize.ENUM('compra', 'venta'),
        allowNull: false,
        defaultValue: 'compra',
      },
      fechaCompra: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      fechaVenta: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('inversiones', ['usuarioId']);
    await queryInterface.addIndex('inversiones', ['symbol']);
    await queryInterface.addIndex('inversiones', ['estado']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('inversiones');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inversiones_estado";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inversiones_tipo";');
  }
};
