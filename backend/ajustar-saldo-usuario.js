// Script para corregir el saldo de un usuario y su préstamo
// Uso: node backend/ajustar-saldo-usuario.js <usuarioId> <nuevoSaldo> <nuevoPrestamoNegativo>

const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');
const Loan = require('./src/models/Loan');

async function main() {
  const usuarioId = process.argv[2];
  const nuevoSaldo = parseFloat(process.argv[3]);
  const nuevoPrestamoNegativo = parseFloat(process.argv[4]);

  if (!usuarioId || isNaN(nuevoSaldo) || isNaN(nuevoPrestamoNegativo)) {
    console.error('Uso: node backend/ajustar-saldo-usuario.js <usuarioId> <nuevoSaldo> <nuevoPrestamoNegativo>');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    const usuario = await User.findByPk(usuarioId);
    if (!usuario) throw new Error('Usuario no encontrado');
    usuario.saldo = nuevoSaldo;
    await usuario.save();
    console.log(`Saldo de usuario #${usuarioId} ajustado a ${nuevoSaldo}`);

    // Buscar préstamo activo más reciente
    const prestamo = await Loan.findOne({
      where: { usuarioId, estado: 'aprobado' },
      order: [['createdAt', 'DESC']]
    });
    if (prestamo) {
      prestamo.montoAprobado = nuevoPrestamoNegativo;
      await prestamo.save();
      console.log(`Préstamo #${prestamo.id} ajustado a ${nuevoPrestamoNegativo}`);
    } else {
      console.log('No se encontró préstamo activo para ajustar.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
