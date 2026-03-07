// Script para recalcular el saldo de préstamos en negativo según cuotas pagadas
// Ejecuta: node backend/recalcular-saldos-prestamos.js

const { sequelize } = require('./src/config/database');
const Loan = require('./src/models/Loan');
const CuotaPrestamo = require('./src/models/CuotaPrestamo');

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida.');

    // Obtener todos los préstamos en negativo
    const prestamosNegativos = await Loan.findAll({
      where: { montoAprobado: { [sequelize.Op.lt]: 0 } },
    });

    for (const prestamo of prestamosNegativos) {
      // Obtener todas las cuotas pagadas de este préstamo
      const cuotasPagadas = await CuotaPrestamo.findAll({
        where: { prestamoId: prestamo.id, pagado: true },
        order: [['numeroCuota', 'ASC']],
      });
      let saldo = parseFloat(prestamo.montoSolicitado || prestamo.montoAprobado || 0);
      for (const cuota of cuotasPagadas) {
        saldo += parseFloat(cuota.montoCuota || 0);
        if (saldo > 0) saldo = 0; // Nunca pasar a positivo
      }
      prestamo.montoAprobado = saldo;
      await prestamo.save();
      console.log(`Préstamo #${prestamo.id} actualizado. Saldo actual: ${saldo}`);
    }
    console.log('Re-cálculo de saldos de préstamos en negativo completado.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
