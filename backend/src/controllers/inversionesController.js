const Inversion = require('../models/Inversion');
const User = require('../models/User');
const { sequelize } = require('../config/database');
const alpacaService = require('../services/alpacaService');
const USER_SAFE_ATTRS = ['id', 'saldo', 'email', 'nombre', 'apellido'];

const findUserSafeByPk = (usuarioId, extraAttrs = []) => {
  const attributes = Array.from(new Set([...USER_SAFE_ATTRS, ...extraAttrs]));
  return User.findByPk(usuarioId, { attributes });
};

// Comprar activo
const comprarAccion = async (req, res) => {
  try {
    const { symbol, cantidad, assetClass } = req.body;
    const usuarioId = req.usuario.id;

    // ⚠️ ADVERTENCIA: Trading real
    console.log('⚠️  TRADING REAL - Esta operación usa dinero REAL');

    // Validaciones
    if (!symbol || !cantidad) {
      return res.status(400).json({ mensaje: 'Simbolo y cantidad requeridos' });
    }

    const cantidadNum = parseFloat(cantidad);
    if (cantidadNum <= 0) {
      return res.status(400).json({ mensaje: 'Cantidad debe ser mayor a 0' });
    }

    // Límite de seguridad para trading real
    if (cantidadNum > 100) {
      return res.status(400).json({ 
        mensaje: 'Limite de seguridad: maximo 100 unidades por operacion',
        nota: 'Contacta soporte para aumentar límites',
      });
    }

    // Obtener usuario
    const usuario = await findUserSafeByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Validar que el activo existe
    const symbolUpper = symbol.toUpperCase();
    const activo = await alpacaService.validarAccion(symbolUpper);

    if (assetClass === 'crypto' && activo.assetClass !== 'crypto') {
      return res.status(400).json({ mensaje: 'Esta wallet solo permite compras de pares crypto reales.' });
    }

    // Obtener precio actual
    const cotizacion = await alpacaService.obtenerCotizacion(activo.symbol);
    const precioCompra = cotizacion.precioCompra || cotizacion.precio;
    const costoEstimado = parseFloat((precioCompra * cantidadNum).toFixed(2));
    const costoValidacion = parseFloat((costoEstimado * (activo.assetClass === 'crypto' ? 1.05 : 1.02)).toFixed(2));

    console.log(`💰 COMPRA REAL: ${cantidadNum} ${activo.symbol} @ $${precioCompra} = $${costoEstimado}`);

    // Validar saldo suficiente
    const saldoDisponible = parseFloat(usuario.saldo);
    if (costoValidacion > saldoDisponible) {
      return res.status(400).json({
        mensaje: 'Saldo insuficiente',
        costoTotal: costoEstimado,
        costoValidacion,
        saldoDisponible,
        faltante: parseFloat((costoValidacion - saldoDisponible).toFixed(2)),
      });
    }

    const estadoCuentaTrading = await alpacaService.obtenerEstadoCuenta();
    if (!estadoCuentaTrading) {
      return res.status(503).json({ mensaje: 'No se pudo consultar la cuenta real de trading.' });
    }

    const poderCompraBroker = activo.assetClass === 'crypto'
      ? parseFloat(estadoCuentaTrading.poderCompraNoMargen || 0)
      : parseFloat(estadoCuentaTrading.poderCompra || 0);

    if (costoValidacion > poderCompraBroker) {
      return res.status(400).json({
        mensaje: 'Fondos insuficientes en la cuenta real de trading.',
        costoValidacion,
        poderCompraBroker,
      });
    }

    // Advertencia final antes de ejecutar
    console.log('🚨 CONFIRMACIÓN REQUERIDA: Esta es una orden REAL');
    console.log(`   Costo estimado: $${costoEstimado} (dinero real)`);

    const orden = await alpacaService.crearOrdenMercado({
      symbol: activo.symbol,
      cantidad: cantidadNum,
      side: 'buy',
      clientOrderId: `be-${usuarioId}-${Date.now()}`,
    });

    const ordenConfirmada = await alpacaService.confirmarOrdenMercado(orden.id);
    const cantidadEjecutada = ordenConfirmada.filledQty || 0;

    if (cantidadEjecutada <= 0) {
      return res.status(400).json({
        mensaje: 'La orden real no se ejecuto. No se registro compra en BE.',
        estadoOrden: ordenConfirmada.status,
        orderId: ordenConfirmada.id,
      });
    }

    const precioEjecutado = ordenConfirmada.filledAvgPrice || precioCompra;
    const costoTotal = parseFloat((precioEjecutado * cantidadEjecutada).toFixed(2));

    if (costoTotal > saldoDisponible) {
      return res.status(409).json({
        mensaje: 'La orden real se ejecuto por encima del saldo BE disponible. Requiere conciliacion manual.',
        costoTotal,
        saldoDisponible,
        orderId: ordenConfirmada.id,
      });
    }

    let inversion;
    await sequelize.transaction(async (transaction) => {
      usuario.saldo = parseFloat((saldoDisponible - costoTotal).toFixed(2));
      await usuario.save({ transaction });

      inversion = await Inversion.create({
        usuarioId,
        symbol: activo.symbol,
        cantidad: cantidadEjecutada,
        precioCompra: precioEjecutado,
        costoTotal,
        estado: 'abierta',
        tipo: 'compra',
        fechaCompra: new Date(),
      }, { transaction });
    });

    console.log(`✅ Compra REAL ejecutada - Nuevo saldo: $${usuario.saldo}`);

    res.json({
      mensaje: `✅ COMPRA REAL EJECUTADA EN ALPACA: ${cantidadEjecutada} ${activo.symbol}`,
      advertencia: '⚠️ Esta operación usó dinero REAL',
      orden: {
        id: ordenConfirmada.id,
        estado: ordenConfirmada.status,
        clientOrderId: ordenConfirmada.clientOrderId,
      },
      inversion: {
        id: inversion.id,
        symbol: inversion.symbol,
        cantidad: inversion.cantidad,
        precioCompra: inversion.precioCompra,
        costoTotal: inversion.costoTotal,
        fechaCompra: inversion.fechaCompra,
      },
      nuevoSaldo: usuario.saldo,
    });
  } catch (error) {
    console.error('❌ Error comprando activo:', error.message);
    res.status(500).json({ 
      mensaje: 'Error procesando compra',
      error: error.message,
    });
  }
};

// Vender acción
const venderAccion = async (req, res) => {
  try {
    const { inversionId } = req.body;
    const usuarioId = req.usuario.id;

    // ⚠️ ADVERTENCIA: Trading real
    console.log('⚠️  VENTA REAL - Esta operación vende acciones REALES');

    if (!inversionId) {
      return res.status(400).json({ mensaje: 'ID de inversión requerido' });
    }

    // Obtener inversión
    const inversion = await Inversion.findOne({
      where: {
        id: inversionId,
        usuarioId,
        estado: 'abierta',
      },
    });

    if (!inversion) {
      return res.status(404).json({ mensaje: 'Inversión no encontrada o ya cerrada' });
    }

    // Obtener precio actual
    const cotizacion = await alpacaService.obtenerCotizacion(inversion.symbol);
    const precioVenta = cotizacion.precioVenta || cotizacion.precio;
    const ingresoTotal = parseFloat((precioVenta * inversion.cantidad).toFixed(2));
    const ganancia = parseFloat((ingresoTotal - inversion.costoTotal).toFixed(2));

    console.log(`💵 VENTA REAL: ${inversion.cantidad} ${inversion.symbol} @ $${precioVenta} = $${ingresoTotal}`);
    console.log(`   Ganancia/Pérdida REAL: $${ganancia}`);

    // Actualizar inversión
    inversion.precioVenta = precioVenta;
    inversion.ingresoTotal = ingresoTotal;
    inversion.ganancia = ganancia;
    inversion.estado = 'cerrada';
    inversion.fechaVenta = new Date();
    await inversion.save();

    // Agregar al saldo BE (dinero real)
    const usuario = await findUserSafeByPk(usuarioId);
    usuario.saldo = parseFloat((parseFloat(usuario.saldo) + ingresoTotal).toFixed(2));
    await usuario.save();

    console.log(`✅ Venta REAL ejecutada - Nuevo saldo: $${usuario.saldo}`);

    res.json({
      mensaje: `✅ VENTA REAL EJECUTADA: ${inversion.cantidad} ${inversion.symbol}`,
      advertencia: ganancia >= 0 
        ? `✅ Ganancia real: $${ganancia}`
        : `⚠️ Pérdida real: $${Math.abs(ganancia)}`,
      venta: {
        id: inversion.id,
        symbol: inversion.symbol,
        cantidad: inversion.cantidad,
        precioCompra: inversion.precioCompra,
        precioVenta: inversion.precioVenta,
        costoTotal: inversion.costoTotal,
        ingresoTotal: inversion.ingresoTotal,
        ganancia: inversion.ganancia,
        porcentajeGanancia: parseFloat(((ganancia / inversion.costoTotal) * 100).toFixed(2)),
        esGanancia: ganancia >= 0,
      },
      nuevoSaldo: usuario.saldo,
    });
  } catch (error) {
    console.error('❌ Error vendiendo acción:', error.message);
    res.status(500).json({
      mensaje: 'Error procesando venta',
      error: error.message,
    });
  }
};

// Listar posiciones abiertas
const listarPosicionesAbiertas = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const posiciones = await Inversion.findAll({
      where: {
        usuarioId,
        estado: 'abierta',
      },
      order: [['fechaCompra', 'DESC']],
    });

    // Obtener precios actuales
    const symbols = [...new Set(posiciones.map(p => p.symbol))];
    let cotizaciones = {};
    try {
      cotizaciones = await alpacaService.obtenerCotizaciones(symbols);
    } catch (quoteError) {
      console.warn('⚠️ No se pudieron enriquecer cotizaciones de posiciones. Se usará precio de compra.', quoteError.message);
    }

    // Calcular valores actuales
    const posicionesConValor = posiciones.map(pos => {
      const cotizacion = cotizaciones[pos.symbol];
      const precioActual = cotizacion?.precio || pos.precioCompra;
      const valorActual = parseFloat((precioActual * pos.cantidad).toFixed(2));
      const gananciaNoRealizada = parseFloat((valorActual - pos.costoTotal).toFixed(2));
      const porcentaje = parseFloat(((gananciaNoRealizada / pos.costoTotal) * 100).toFixed(2));

      return {
        id: pos.id,
        symbol: pos.symbol,
        cantidad: pos.cantidad,
        precioCompra: pos.precioCompra,
        precioActual,
        costoTotal: pos.costoTotal,
        valorActual,
        gananciaNoRealizada,
        porcentajeGanancia: porcentaje,
        fechaCompra: pos.fechaCompra,
      };
    });

    const valorTotal = posicionesConValor.reduce((sum, p) => sum + p.valorActual, 0);
    const gananciaTotal = posicionesConValor.reduce((sum, p) => sum + p.gananciaNoRealizada, 0);

    res.json({
      posiciones: posicionesConValor,
      resumen: {
        totalPosiciones: posicionesConValor.length,
        valorTotal: parseFloat(valorTotal.toFixed(2)),
        gananciaTotal: parseFloat(gananciaTotal.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('❌ Error listando posiciones:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Obtener portfolio completo (abiertas + historial)
const obtenerPortfolio = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const usuario = await findUserSafeByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Posiciones abiertas
    const posicionesAbiertas = await Inversion.findAll({
      where: { usuarioId, estado: 'abierta' },
      order: [['fechaCompra', 'DESC']],
    });

    // Historial cerrado
    const historial = await Inversion.findAll({
      where: { usuarioId, estado: 'cerrada' },
      order: [['fechaVenta', 'DESC']],
      limit: 50,
    });

    // Obtener precios actuales para posiciones abiertas
    const symbols = [...new Set(posicionesAbiertas.map(p => p.symbol))];
    let cotizaciones = {};
    if (symbols.length > 0) {
      try {
        cotizaciones = await alpacaService.obtenerCotizaciones(symbols);
      } catch (quoteError) {
        console.warn('⚠️ No se pudieron obtener cotizaciones del portfolio. Se usará precio de compra.', quoteError.message);
      }
    }

    // Calcular valores
    const posicionesConValor = posicionesAbiertas.map(pos => {
      const cotizacion = cotizaciones[pos.symbol];
      const precioActual = cotizacion?.precio || pos.precioCompra;
      const valorActual = parseFloat((precioActual * pos.cantidad).toFixed(2));
      const gananciaNoRealizada = parseFloat((valorActual - pos.costoTotal).toFixed(2));

      return {
        ...pos.toJSON(),
        precioActual,
        valorActual,
        gananciaNoRealizada,
      };
    });

    const valorPortfolio = posicionesConValor.reduce((sum, p) => sum + p.valorActual, 0);
    const gananciaNoRealizada = posicionesConValor.reduce((sum, p) => sum + p.gananciaNoRealizada, 0);
    const gananciaRealizada = historial.reduce((sum, h) => sum + parseFloat(h.ganancia || 0), 0);

    res.json({
      saldoDisponible: parseFloat(usuario.saldo),
      valorPortfolio: parseFloat(valorPortfolio.toFixed(2)),
      valorTotal: parseFloat((parseFloat(usuario.saldo) + valorPortfolio).toFixed(2)),
      posicionesAbiertas: posicionesConValor,
      historial: historial.map(h => h.toJSON()),
      estadisticas: {
        totalPosicionesAbiertas: posicionesAbiertas.length,
        totalOperacionesCerradas: historial.length,
        gananciaNoRealizada: parseFloat(gananciaNoRealizada.toFixed(2)),
        gananciaRealizada: parseFloat(gananciaRealizada.toFixed(2)),
        gananciaTotal: parseFloat((gananciaNoRealizada + gananciaRealizada).toFixed(2)),
      },
    });
  } catch (error) {
    console.error('❌ Error obteniendo portfolio:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Obtener cotización de una acción
const obtenerCotizacionAccion = async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ mensaje: 'Symbol requerido' });
    }

    const cotizacion = await alpacaService.obtenerCotizacion(symbol.toUpperCase());

    res.json(cotizacion);
  } catch (error) {
    console.error(`❌ Error obteniendo cotización:`, error.message);
    res.status(500).json({ error: error.message });
  }
};

// Buscar activos
const buscarAcciones = async (req, res) => {
  try {
    const { q, assetClass } = req.query;

    if (!q || q.length < 1) {
      return res.status(400).json({ mensaje: 'Query de búsqueda requerido' });
    }

    const resultados = await alpacaService.buscarAccion(q, { assetClass });

    res.json({ resultados });
  } catch (error) {
    console.error('❌ Error buscando activos:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Obtener historial de precios
const obtenerHistorialPrecios = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1Day', limit = 100 } = req.query;

    const historial = await alpacaService.obtenerHistorial(
      symbol.toUpperCase(),
      timeframe,
      parseInt(limit)
    );

    res.json({
      symbol: symbol.toUpperCase(),
      timeframe,
      datos: historial,
    });
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  comprarAccion,
  venderAccion,
  listarPosicionesAbiertas,
  obtenerPortfolio,
  obtenerCotizacionAccion,
  buscarAcciones,
  obtenerHistorialPrecios,
};
