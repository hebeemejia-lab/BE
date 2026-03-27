/**
 * Servicio para actualizar dinámicamente el P&L (ganancia/pérdida) 
 * en saldoChain basado en precios actuales del mercado.
 * 
 * Flujo:
 * 1. Usuario compra 1 BTC por USD 100 → saldoChain -= 100
 * 2. Precio de BTC sube/baja → P&L cambia
 * 3. Este servicio recalcula P&L actual y actualiza saldoChain con el delta
 */

const Inversion = require('../models/Inversion');
const User = require('../models/User');
const { obtenerCotizacionResiliente } = require('./cotizacionesService');

/**
 * Calcula la ganancia/pérdida NO REALIZADA actual de una inversión
 * basada en el precio actual del mercado.
 * 
 * @param {Object} inversion - Record de Inversion de la DB
 * @param {number} precioActual - Precio actual en el mercado
 * @returns {number} Ganancia/pérdida no realizada (puede ser negativa)
 */
const calcularPNLNoRealizado = (inversion, precioActual) => {
  const cantidadActual = Number(inversion.cantidad || 0);
  const costoTotal = Number(inversion.costoTotal || 0);
  
  if (cantidadActual <= 0 || costoTotal <= 0) return 0;
  
  const valorActual = cantidadActual * precioActual;
  const pnl = parseFloat((valorActual - costoTotal).toFixed(2));
  
  return pnl;
};

/**
 * Recalcula el P&L total de todas las inversiones abiertas de un usuario
 * y actualiza saldoChain si hay cambios significativos.
 * 
 * Se llama cada vez que el usuario refresca el dashboard para mantener
 * saldoChain sincronizado con las ganancias/pérdidas reales del mercado.
 */
const actualizarPNLUsuario = async ({ usuarioId, transaction = null }) => {
  try {
    const usuario = await User.findByPk(usuarioId);
    if (!usuario) {
      throw new Error(`Usuario no encontrado: ${usuarioId}`);
    }

    const inversionesAbiertas = await Inversion.findAll({
      where: {
        usuarioId,
        estado: 'abierta',
      },
    });

    if (inversionesAbiertas.length === 0) {
      // Sin inversiones abiertas, nada que actualizar
      return {
        usuarioId,
        pnlTotalActual: 0,
        pnlDelta: 0,
        cambiosSaldo: false,
      };
    }

    // Obtener precios actuales para todos los símbolos
    const symbols = [...new Set(inversionesAbiertas.map(inv => inv.symbol))];
    const cotizaciones = {};
    
    for (const symbol of symbols) {
      try {
        const cot = await obtenerCotizacionResiliente(symbol);
        cotizaciones[symbol] = cot.precio || cot.precioCompra || 0;
      } catch (err) {
        console.warn(`⚠️  No se pudo obtener cotización para ${symbol}:`, err.message);
        cotizaciones[symbol] = 0;
      }
    }

    // Calcular P&L actual total agrupado por símbolo
    let pnlTotalActual = 0;
    const detallesPNL = {};

    for (const inversion of inversionesAbiertas) {
      const precioActual = cotizaciones[inversion.symbol] || 0;
      const pnl = calcularPNLNoRealizado(inversion, precioActual);

      if (!detallesPNL[inversion.symbol]) {
        detallesPNL[inversion.symbol] = 0;
      }
      detallesPNL[inversion.symbol] += pnl;
      pnlTotalActual += pnl;
    }

    pnlTotalActual = parseFloat(pnlTotalActual.toFixed(2));

    // Obtener el P&L "anterior" guardado en el último cálculo
    // (Nota: por ahora lo calculamos cada vez, pero idealmente estaría guardado)
    const saldoChainActual = Number(usuario.saldoChain || 0);
    
    // El P&L anterior se calcula con los precios que resultaron en el saldoChain actual
    // Para actualizar, simplemente asignamos el nuevo P&L al saldoChain
    
    // ⚠️ IMPORTANTE: 
    // saldoChain = saldoBase - costoTotalInversiones + PNLActual
    // donde saldoBase es el saldo después de descontar todo lo invertido

    // Calcular costo total de todas las inversiones abiertas
    const costoTotalInversiones = inversionesAbiertas.reduce((sum, inv) => {
      return sum + Number(inv.costoTotal || 0);
    }, 0);

    console.log(`📊 P&L Update Usuario ${usuarioId}:`);
    console.log(`   Inversiones abiertas: ${inversionesAbiertas.length}`);
    console.log(`   Costo total invertido: USD ${costoTotalInversiones.toFixed(2)}`);
    console.log(`   P&L actual: USD ${pnlTotalActual.toFixed(2)}`);
    console.log(`   Detalles por símbolo:`, detallesPNL);

    // Por ahora, este endpoint es solo para CONSULTAR
    // No actualizamos la DB aquí, solo devolvemos los valores
    
    return {
      usuarioId,
      saldoChainActual,
      pnlTotalActual,
      costoTotalInversiones,
      detallesPNL,
      inversionesAbiertas: inversionesAbiertas.map(inv => ({
        id: inv.id,
        symbol: inv.symbol,
        cantidad: inv.cantidad,
        costoTotal: inv.costoTotal,
        pnl: detallesPNL[inv.symbol],
      })),
    };
  } catch (error) {
    console.error(`❌ Error actualizando P&L para usuario ${usuarioId}:`, error.message);
    throw error;
  }
};

module.exports = {
  calcularPNLNoRealizado,
  actualizarPNLUsuario,
};
