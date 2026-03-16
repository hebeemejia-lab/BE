// Script para agregar la columna walletId a la tabla Users (SQLite)
const { sequelize } = require('../src/config/database');

async function addWalletIdColumn() {
  await sequelize.authenticate();
  await sequelize.query(`ALTER TABLE Users ADD COLUMN walletId VARCHAR(64);`);
  console.log('Columna walletId agregada a Users (sin UNIQUE).');
  await sequelize.close();
}

addWalletIdColumn().catch(e => {
  console.error('Error agregando columna walletId:', e);
  process.exit(1);
});
