// Script para poblar walletId únicos a todos los usuarios existentes
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');

async function poblarWalletIds() {
  await sequelize.authenticate();
  const usuarios = await User.findAll();
  let actualizados = 0;
  for (const usuario of usuarios) {
    if (!usuario.walletId) {
      usuario.walletId = uuidv4().replace(/-/g, '').slice(0, 32); // 32 chars
      await usuario.save();
      actualizados++;
    }
  }
  console.log(`Usuarios actualizados con walletId: ${actualizados}`);
  await sequelize.close();
}

poblarWalletIds().catch(e => {
  console.error('Error poblando walletId:', e);
  process.exit(1);
});
