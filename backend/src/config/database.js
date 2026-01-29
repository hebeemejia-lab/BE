const { Sequelize } = require('sequelize');
const path = require('path');

// Configuración según el entorno
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

let sequelize;

// Intentar usar PostgreSQL si DATABASE_URL está configurado
// De lo contrario, usar SQLite (funciona en cualquier entorno)
if (databaseUrl && databaseUrl.includes('postgres')) {
  // Usar PostgreSQL en producción (Render)
  console.log('🔧 Conectando a PostgreSQL en producción...');
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
  // Usar SQLite (desarrollo o producción sin PostgreSQL)
  const dbPath = isProduction 
    ? '/opt/render/project/src/backend/banco.db'  // Render path
    : path.join(__dirname, '../../banco.db');     // Local path
  
  console.log(`🔧 Conectando a SQLite (${isProduction ? 'producción' : 'desarrollo'})...`);
  console.log(`📁 Ruta DB: ${dbPath}`);
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
  });
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Base de datos conectada exitosamente`);
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados con la base de datos');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

