'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      apellido: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '',
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      emailVerificado: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      emailVerificationToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      emailVerificationExpires: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      cedula: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      telefono: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      direccion: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      saldo: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      saldoChain: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      saldoEnTransitoAlpaca: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      stripeCustomerId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      alpacaAccountId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      alpacaAccountStatus: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'not_linked',
      },
      alpacaAchEnabledAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rol: {
        type: Sequelize.ENUM('cliente', 'admin'),
        defaultValue: 'cliente',
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  },
};
