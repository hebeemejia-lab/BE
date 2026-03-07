// Script para editar el saldo negativo (montoAprobado) de un préstamo de un usuario específico
// Uso: node editar-saldo-negativo.js <usuarioId> <nuevoSaldoNegativo>

const { Loan } = require('./src/models/Loan');
const sequelize = require('./src/models');

async function editarSaldoNegativo(usuarioId, nuevoSaldoNegativo) {
  try {
    await sequelize.authenticate();
    // Buscar el préstamo negativo más antiguo del usuario
    const prestamo = await Loan.findOne({
      where: { usuarioId, estado: 'aprobado' },
      order: [['createdAt', 'ASC']]
    });
    if (!prestamo) {
      console.log('No se encontró préstamo negativo para el usuario');
      return;
    }
    prestamo.montoAprobado = -Math.abs(Number(nuevoSaldoNegativo));
    await prestamo.save();
    console.log(`Saldo negativo actualizado para el préstamo #${prestamo.id}: ${prestamo.montoAprobado}`);
  } catch (err) {
    console.error('Error actualizando saldo negativo:', err);
  } finally {
    await sequelize.close();
  }
}

// Leer argumentos de línea de comandos
const [,, usuarioId, nuevoSaldoNegativo] = process.argv;
if (!usuarioId || !nuevoSaldoNegativo) {
  console.log('Uso: node editar-saldo-negativo.js <usuarioId> <nuevoSaldoNegativo>');
  process.exit(1);
}
editarSaldoNegativo(usuarioId, nuevoSaldoNegativo);
