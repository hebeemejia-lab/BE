const { Sequelize } = require('sequelize');
const path = require('path');

// Configuración según el entorno
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (isProduction && databaseUrl) {
  // PostgreSQL en producción (Render)
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
  });
} else {
  // SQLite en desarrollo local
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../banco.db'),
    logging: false,
  });
}

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

