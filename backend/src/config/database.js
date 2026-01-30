const { Sequelize } = require('sequelize');
const path = require('path');

// Configuración según el entorno
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

let sequelize;

console.log('🔍 Detectando base de datos...');
console.log(`📌 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`📌 DATABASE_URL presente: ${databaseUrl ? 'SÍ' : 'NO'}`);
if (databaseUrl) {
  console.log(`📌 DATABASE_URL inicia con: ${databaseUrl.substring(0, 20)}...`);
}

// Usar PostgreSQL en producción, SQLite en desarrollo
if (databaseUrl && databaseUrl.toLowerCase().includes('postgres')) {
  // PostgreSQL en producción
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
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
      acquire: 30000
    }
  });
} else {
  // SQLite (desarrollo o producción sin PostgreSQL)
  const dbPath = isProduction 
    ? '/opt/render/project/src/backend/banco.db'  // Render path
    : path.join(__dirname, '../../banco.db');     // Local path
  
  const dbType = isProduction ? 'producción' : 'desarrollo';
  console.log(`🔧 Conectando a SQLite (${dbType})...`);
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

