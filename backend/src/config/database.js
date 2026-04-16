const { Sequelize } = require('sequelize');
const path = require('path');

// Configuración según el entorno
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;


let sequelizeInstance;
function getSequelize() {
  if (sequelizeInstance) return sequelizeInstance;
  console.log('🔍 Detectando base de datos...');
  console.log(`📌 NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`📌 DATABASE_URL presente: ${databaseUrl ? 'SÍ' : 'NO'}`);
  if (databaseUrl) {
    console.log(`📌 DATABASE_URL inicia con: ${databaseUrl.substring(0, 20)}...`);
  }
  if (databaseUrl && databaseUrl.toLowerCase().includes('postgres')) {
    // PostgreSQL en producción
    console.log('🔧 Conectando a PostgreSQL en producción...');
    sequelizeInstance = new Sequelize(databaseUrl, {
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
      ? '/opt/render/project/src/backend/banco.db'
      : path.join(__dirname, '../../banco.db');
    const dbType = isProduction ? 'producción' : 'desarrollo';
    console.log(`🔧 Conectando a SQLite (${dbType})...`);
    console.log(`📁 Ruta DB: ${dbPath}`);
    sequelizeInstance = new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      logging: false,
    });
  }
  return sequelizeInstance;
}

const connectDB = async () => {
  const sequelize = getSequelize();
  try {
    await sequelize.authenticate();
    console.log(`✅ Base de datos conectada exitosamente`);
    // Solo sincronizar con alter en desarrollo o si se fuerza por variable
    const allowAlter = process.env.DB_SYNC_ALTER === 'true';
    if (process.env.NODE_ENV === 'production' && !allowAlter) {
      // En producción: solo conectar, no hacer sync ni alter
      // await sequelize.sync(); // Si quieres sincronizar solo una vez manualmente, descomenta esta línea
      console.log('⚠️ En producción: NO se ejecuta sync ni alter. Haz migraciones manualmente.');
    } else {
      await sequelize.sync({ alter: true });
      console.log('✅ Modelos sincronizados con la base de datos (alter)');
    }
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    process.exit(1);
  }
};

exports.getSequelize = getSequelize;
exports.sequelize = getSequelize();
exports.connectDB = connectDB;

