// Script para editar el saldo positivo (saldo) de un usuario específico
// Uso: node editar-saldo-positivo.js <usuarioId> <nuevoSaldo>

const { User } = require('./src/models/User');
const sequelize = require('./src/models');

async function editarSaldoPositivo(usuarioId, nuevoSaldo) {
  try {
    await sequelize.authenticate();
    const usuario = await User.findByPk(usuarioId);
    if (!usuario) {
      console.log('No se encontró el usuario');
      return;
    }
    usuario.saldo = Number(nuevoSaldo);
    await usuario.save();
    console.log(`Saldo actualizado para el usuario #${usuario.id}: ${usuario.saldo}`);
  } catch (err) {
    console.error('Error actualizando saldo:', err);
  } finally {
    await sequelize.close();
  }
}

// Leer argumentos de línea de comandos
const [,, usuarioId, nuevoSaldo] = process.argv;
if (!usuarioId || !nuevoSaldo) {
  console.log('Uso: node editar-saldo-positivo.js <usuarioId> <nuevoSaldo>');
  process.exit(1);
}
editarSaldoPositivo(usuarioId, nuevoSaldo);
