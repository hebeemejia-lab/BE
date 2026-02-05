const Inversion = require('../models/Inversion');
const User = require('../models/User');
const alpacaService = require('../services/alpacaService');
const { Op } = require('sequelize');

// Comprar acción
const comprarAccion = async (req, res) => {
  try {
    const { symbol, cantidad } = req.body;
    const usuarioId = req.usuario.id;

    // Validaciones
    if (!symbol || !cantidad) {
      return res.status(400).json({ mensaje: 'Symbol y cantidad requeridos' });
    }

    const cantidadNum = parseFloat(cantidad);
    if (cantidadNum <= 0) {
      return res.status(400).json({ mensaje: 'Cantidad debe ser mayor a 0' });
    }

    // Obtener usuario
    const usuario = await User.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Validar que la acción existe
    const symbolUpper = symbol.toUpperCase();
    await alpacaService.validarAccion(symbolUpper);

    // Obtener precio actual
    const cotizacion = await alpacaService.obtenerCotizacion(symbolUpper);
    const precioCompra = cotizacion.precioCompra || cotizacion.precio;
    const costoTotal = parseFloat((precioCompra * cantidadNum).toFixed(2));

    console.log(`💰 Compra: ${cantidadNum} ${symbolUpper} @ $${precioCompra} = $${costoTotal}`);

    // Validar saldo suficiente
    const saldoDisponible = parseFloat(usuario.saldo);
    if (costoTotal > saldoDisponible) {
      return res.status(400).json({
        mensaje: 'Saldo insuficiente',
        costoTotal,
        saldoDisponible,
        faltante: parseFloat((costoTotal - saldoDisponible).toFixed(2)),
      });
    }

    // Descontar del saldo BE
    usuario.saldo = parseFloat((saldoDisponible - costoTotal).toFixed(2));
    await usuario.save();

    // Guardar inversión
    const inversion = await Inversion.create({
      usuarioId,
      symbol: symbolUpper,
      cantidad: cantidadNum,
      precioCompra,
      costoTotal,
      estado: 'abierta',
      tipo: 'compra',
      fechaCompra: new Date(),
    });

    console.log(`✅ Compra exitosa - Nuevo saldo: $${usuario.saldo}`);

    res.json({
      mensaje: `Compra exitosa: ${cantidadNum} ${symbolUpper}`,
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
    console.error('❌ Error comprando acción:', error.message);
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

    console.log(`💵 Venta: ${inversion.cantidad} ${inversion.symbol} @ $${precioVenta} = $${ingresoTotal}`);
    console.log(`   Ganancia/Pérdida: $${ganancia}`);

    // Actualizar inversión
    inversion.precioVenta = precioVenta;
    inversion.ingresoTotal = ingresoTotal;
    inversion.ganancia = ganancia;
    inversion.estado = 'cerrada';
    inversion.fechaVenta = new Date();
    await inversion.save();

    // Agregar al saldo BE
    const usuario = await User.findByPk(usuarioId);
    usuario.saldo = parseFloat((parseFloat(usuario.saldo) + ingresoTotal).toFixed(2));
    await usuario.save();

    console.log(`✅ Venta exitosa - Nuevo saldo: $${usuario.saldo}`);

    res.json({
      mensaje: `Venta exitosa: ${inversion.cantidad} ${inversion.symbol}`,
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
    const cotizaciones = await alpacaService.obtenerCotizaciones(symbols);

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
    const usuario = await User.findByPk(usuarioId);

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
    const cotizaciones = symbols.length > 0 
      ? await alpacaService.obtenerCotizaciones(symbols)
      : {};

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

// Buscar acciones
const buscarAcciones = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 1) {
      return res.status(400).json({ mensaje: 'Query de búsqueda requerido' });
    }

    const resultados = await alpacaService.buscarAccion(q);

    res.json({ resultados });
  } catch (error) {
    console.error('❌ Error buscando acciones:', error.message);
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
