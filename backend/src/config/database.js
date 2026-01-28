const { Sequelize } = require('sequelize');
const path = require('path');

// Configuración según el entorno
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

let sequelize;

// Usar SQLite siempre (tanto en desarrollo como producción)
// Cuando agregues una BD remota real, cambiar esta lógica
sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../banco.db'),
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✓ ${isProduction ? 'PostgreSQL' : 'SQLite'} conectado exitosamente`);
    await sequelize.sync({ alter: true });
    console.log('✓ Base de datos sincronizada');
  } catch (error) {
    console.error('✗ Error conectando a la base de datos:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

