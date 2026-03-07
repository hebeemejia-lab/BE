// Script para actualizar saldo disponible y saldo negativo de un usuario
// Uso: node actualizar-saldos.js <usuarioId> <saldoDisponible> <saldoNegativo>

const { User, Loan, sequelize } = require('./src/models');

async function actualizarSaldos(usuarioId, saldoDisponible, saldoNegativo) {
  try {
    await sequelize.authenticate();
    // Actualizar saldo disponible
    const usuario = await User.findByPk(usuarioId);
    if (!usuario) {
      console.log('No se encontró el usuario');
      return;
    }
    usuario.saldo = Number(saldoDisponible);
    await usuario.save();
    console.log(`Saldo disponible actualizado: ${usuario.saldo}`);

    // Actualizar saldo negativo (préstamo más antiguo aprobado)
    const prestamo = await Loan.findOne({
      where: { usuarioId, estado: 'aprobado' },
      order: [['createdAt', 'ASC']]
    });
    if (!prestamo) {
      console.log('No se encontró préstamo negativo aprobado para el usuario');
      return;
    }
    prestamo.montoAprobado = -Math.abs(Number(saldoNegativo));
    await prestamo.save();
    console.log(`Saldo negativo actualizado para el préstamo #${prestamo.id}: ${prestamo.montoAprobado}`);
  } catch (err) {
    console.error('Error actualizando saldos:', err);
  } finally {
    await sequelize.close();
  }
}

// Leer argumentos de línea de comandos
const [,, usuarioId, saldoDisponible, saldoNegativo] = process.argv;
if (!usuarioId || !saldoDisponible || !saldoNegativo) {
  console.log('Uso: node actualizar-saldos.js <usuarioId> <saldoDisponible> <saldoNegativo>');
  process.exit(1);
}
actualizarSaldos(usuarioId, saldoDisponible, saldoNegativo);
