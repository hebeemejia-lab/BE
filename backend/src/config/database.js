const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../banco.db'),
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ SQLite conectado exitosamente');
    await sequelize.sync({ alter: true });
    console.log('✓ Base de datos sincronizada');
  } catch (error) {
    console.error('✗ Error conectando a SQLite:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

