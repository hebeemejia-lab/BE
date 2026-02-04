const sequelize = require('./src/config/database');
const User = require('./src/models/User');
const Loan = require('./src/models/Loan');

async function resetearSaldoPrestamos() {
  try {
    await sequelize.authenticate();
    console.log('✓ Conectado a la base de datos');

    // Obtener todos los préstamos aprobados
    const prestamosAprobados = await Loan.findAll({
      where: { estado: 'aprobado' },
      attributes: ['usuarioId', 'montoAprobado'],
    });

    console.log(`📊 Préstamos aprobados encontrados: ${prestamosAprobados.length}`);

    // Agrupar por usuario y calcular el total de préstamos
    const prestamosPorUsuario = {};
    for (const prestamo of prestamosAprobados) {
      const userId = prestamo.usuarioId;
      const monto = parseFloat(prestamo.montoAprobado) || 0;
      
      if (!prestamosPorUsuario[userId]) {
        prestamosPorUsuario[userId] = 0;
      }
      prestamosPorUsuario[userId] += monto;
    }

    // Restar los montos de préstamos del saldo de cada usuario
    let usuariosActualizados = 0;
    for (const [userId, montoPrestamos] of Object.entries(prestamosPorUsuario)) {
      const usuario = await User.findByPk(userId);
      
      if (usuario) {
        const saldoActual = parseFloat(usuario.saldo);
        const nuevoSaldo = Math.max(0, saldoActual - montoPrestamos); // No permitir saldo negativo
        
        console.log(`👤 Usuario ${usuario.nombre} ${usuario.apellido}:`);
        console.log(`   Saldo actual: $${saldoActual.toFixed(2)}`);
        console.log(`   Préstamos aprobados: $${montoPrestamos.toFixed(2)}`);
        console.log(`   Nuevo saldo: $${nuevoSaldo.toFixed(2)}`);
        
        usuario.saldo = nuevoSaldo;
        await usuario.save();
        usuariosActualizados++;
      }
    }

    console.log(`\n✅ Proceso completado`);
    console.log(`✓ ${usuariosActualizados} usuarios actualizados`);
    console.log(`✓ Los préstamos ahora están desvinculados del saldo de la cuenta`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

resetearSaldoPrestamos();
