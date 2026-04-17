// Script para sincronizar tablas manualmente en producción
require('dotenv').config();
const { getSequelize } = require('./src/config/database');

const sequelize = getSequelize();

sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Tablas sincronizadas correctamente en la base de datos.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error al sincronizar tablas:', err);
    process.exit(1);
  });
