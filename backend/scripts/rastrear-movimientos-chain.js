// Script para rastrear movimientos de dinero relacionados con el fondo CHAIN
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL no está configurado. Verifica tu archivo .env.');
}
const { Inversion } = require('../src/models');
const { Op } = require('sequelize');

async function rastrearMovimientosChain(usuarioId) {
  // Buscar todas las inversiones relacionadas con CHAIN (abiertas y cerradas)
  const posicionesChain = await Inversion.findAll({
    where: {
      usuarioId,
      symbol: { [Op.like]: '%CHAIN%' },
    },
    order: [['fechaCompra', 'DESC']],
  });

  if (!posicionesChain.length) {
    console.log('No se encontraron movimientos relacionados con CHAIN para este usuario.');
    return;
  }

  console.log(`Movimientos relacionados con CHAIN para usuario ${usuarioId}:`);
  posicionesChain.forEach(pos => {
    console.log({
      id: pos.id,
      estado: pos.estado,
      cantidad: pos.cantidad,
      costoTotal: pos.costoTotal,
      ingresoTotal: pos.ingresoTotal,
      ganancia: pos.ganancia,
      fechaCompra: pos.fechaCompra,
      fechaVenta: pos.fechaVenta,
      tipo: pos.tipo,
    });
  });
}

// Permitir pasar usuarioId como argumento de línea de comandos
const usuarioIdArg = process.argv[2];
if (!usuarioIdArg) {
  console.error('Debes indicar el usuarioId como argumento. Ejemplo: node rastrear-movimientos-chain.js 123');
  process.exit(1);
}
rastrearMovimientosChain(Number(usuarioIdArg));
