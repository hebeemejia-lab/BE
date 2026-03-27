const Inversion = require('../models/Inversion');
const Comision = require('../models/Comision');
const User = require('../models/User');
const { sequelize } = require('../config/database');
const alpacaService = require('../services/alpacaService');
const bybitService = require('../services/bybitService');
const { reconcileOpenPositions } = require('../services/inversionRepairService');
const pnlUpdateService = require('../services/pnlUpdateService');
const axios = require('axios');

const COMISION_PCT = 0.015; // 1.5% por operación

const normalizeCryptoSymbol = (symbol) => {
  const normalized = String(symbol || '').trim().toUpperCase();
  if (!normalized) return normalized;
  if (normalized.includes('/')) return normalized;
  return `${normalized}/USD`;
};

const isCryptoSymbol = (symbol) => String(symbol || '').includes('/');

const obtenerCotizacionCryptoFallback = async (symbol) => {
  const base = normalizeCryptoSymbol(symbol).split('/')[0];
  const response = await axios.get('https://min-api.cryptocompare.com/data/price', {
    params: { fsym: base, tsyms: 'USD' },
    timeout: 7000,
  });

  const precio = Number(response?.data?.USD || 0);
  if (!Number.isFinite(precio) || precio <= 0) {
    throw new Error(`No se pudo obtener cotizacion fallback para ${base}`);
  }

  return {
    symbol: `${base}/USD`,
    precio,
    precioCompra: precio,
    precioVenta: precio,
    assetClass: 'crypto',
    source: 'fallback',
  };
};

const obtenerCotizacionResiliente = async (symbol) => {
  const normalized = String(symbol || '').toUpperCase();
  try {
    return await alpacaService.obtenerCotizacion(normalized);
  } catch (error) {
    if (!isCryptoSymbol(normalized)) {
      throw error;
    }
    return obtenerCotizacionCryptoFallback(normalized);
  }
};

const obtenerCotizacionesResilientes = async (symbols) => {
  const entries = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const quote = await obtenerCotizacionResiliente(symbol);
        return [symbol, quote];
      } catch (_) {
        return [symbol, null];
      }
    }),
  );

  return entries.reduce((acc, [symbol, quote]) => {
    acc[symbol] = quote;
    return acc;
  }, {});
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
    const usuario = await User.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Definir activo segun clase solicitada.
    const symbolUpper = String(symbol || '').toUpperCase();
    const assetClassNormalized = String(assetClass || '').toLowerCase();
    const esCryptoSolicitado = assetClassNormalized === 'crypto';

    let activo;
    if (esCryptoSolicitado) {
      activo = {
        valid: true,
        symbol: normalizeCryptoSymbol(symbolUpper),
        assetClass: 'crypto',
        nombre: normalizeCryptoSymbol(symbolUpper),
      };
    } else {
      activo = await alpacaService.validarAccion(symbolUpper);
    }

    if (esCryptoSolicitado && activo.assetClass !== 'crypto') {
      return res.status(400).json({ mensaje: 'Esta wallet solo permite compras de pares crypto reales.' });
    }

    // Obtener precio actual
    const cotizacion = await obtenerCotizacionResiliente(activo.symbol);
    const precioCompra = cotizacion.precioCompra || cotizacion.precio;
    const costoEstimado = parseFloat((precioCompra * cantidadNum).toFixed(2));
    const costoValidacion = parseFloat((costoEstimado * (activo.assetClass === 'crypto' ? 1.05 : 1.02)).toFixed(2));
    const esCrypto = activo.assetClass === 'crypto';

    console.log(`💰 COMPRA REAL: ${cantidadNum} ${activo.symbol} @ $${precioCompra} = $${costoEstimado}`);

    // Validar saldo suficiente
    const saldoDisponible = parseFloat(esCrypto ? (usuario.saldoChain || 0) : usuario.saldo);
    if (costoValidacion > saldoDisponible) {
      return res.status(400).json({
        mensaje: esCrypto ? 'Saldo CHAIN insuficiente' : 'Saldo insuficiente',
        costoTotal: costoEstimado,
        costoValidacion,
        saldoDisponible,
        faltante: parseFloat((costoValidacion - saldoDisponible).toFixed(2)),
        tipoSaldo: esCrypto ? 'saldoChain' : 'saldo',
      });
    }

    // Crypto: compra real en Bybit + cobro de comisión 1.5%
    if (esCrypto) {
      const comisionMonto = parseFloat((costoEstimado * COMISION_PCT).toFixed(2));
      const costoTotalConComision = parseFloat((costoEstimado + comisionMonto).toFixed(2));

      // Re-validar saldo incluyendo la comisión
      if (costoTotalConComision > saldoDisponible) {
        return res.status(400).json({
          mensaje: 'Saldo CHAIN insuficiente (incluida comisión del 1.5%)',
          costoActivo: costoEstimado,
          comision: comisionMonto,
          costoTotal: costoTotalConComision,
          saldoDisponible,
          faltante: parseFloat((costoTotalConComision - saldoDisponible).toFixed(2)),
          tipoSaldo: 'saldoChain',
        });
      }

      // Extraer símbolo base (BTC de "BTC/USD")
      const baseSymbol = activo.symbol.split('/')[0];

      // Colocar orden de mercado spot en Bybit
      const bybitOrden = await bybitService.placeSpotOrder({
        symbol: `${baseSymbol}USDT`,
        side: 'buy',
        qty: cantidadNum,
      });

      // Esperar fill (hasta 10s: 5 intentos × 2s)
      let filledOrder = null;
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await bybitService.getSpotOrderStatus({
          orderId: bybitOrden.orderId,
          symbol: `${baseSymbol}USDT`,
        });
        if (status && ['Filled', 'PartiallyFilled'].includes(status.orderStatus)) {
          filledOrder = status;
          break;
        }
      }

      const cantidadEjecutada = filledOrder
        ? parseFloat(filledOrder.cumExecQty || cantidadNum)
        : cantidadNum;
      const precioEjecutado = filledOrder
        ? parseFloat(filledOrder.avgPrice || precioCompra)
        : precioCompra;
      const costoReal = parseFloat((precioEjecutado * cantidadEjecutada).toFixed(2));
      const comisionReal = parseFloat((costoReal * COMISION_PCT).toFixed(2));
      const totalDeducir = parseFloat((costoReal + comisionReal).toFixed(2));

      let inversion;
      let comision;
      await sequelize.transaction(async (t) => {
        usuario.saldoChain = parseFloat((saldoDisponible - totalDeducir).toFixed(2));
        await usuario.save({ transaction: t });

        inversion = await Inversion.create({
          usuarioId,
          symbol: activo.symbol,
          cantidad: cantidadEjecutada,
          precioCompra: precioEjecutado,
          costoTotal: costoReal,
          estado: 'abierta',
          tipo: 'compra',
          fechaCompra: new Date(),
        }, { transaction: t });

        comision = await Comision.create({
          usuarioId,
          inversionId: inversion.id,
          tipo: 'compra',
          symbol: activo.symbol,
          montoBase: costoReal,
          porcentaje: COMISION_PCT * 100,
          montoComision: comisionReal,
          precioEjecutado,
          cantidadCrypto: cantidadEjecutada,
          bybitOrderId: bybitOrden.orderId || null,
        }, { transaction: t });
      });

      console.log(`✅ Compra BYBIT REAL: ${cantidadEjecutada} ${activo.symbol} @ $${precioEjecutado} | Comisión: $${comisionReal} | Nuevo saldoChain: $${usuario.saldoChain}`);

      return res.json({
        mensaje: `✅ COMPRA REAL EJECUTADA EN BYBIT: ${cantidadEjecutada} ${activo.symbol}`,
        modo: 'bybit_spot',
        recibo: {
          operacion: 'COMPRA',
          symbol: activo.symbol,
          cantidad: cantidadEjecutada,
          precioEjecutado,
          costoActivo: costoReal,
          comisionPct: `${(COMISION_PCT * 100).toFixed(1)}%`,
          comisionUSD: comisionReal,
          totalDeducido: totalDeducir,
          bybitOrderId: bybitOrden.orderId,
          fecha: new Date().toISOString(),
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
        nuevoSaldoChain: parseFloat(usuario.saldoChain || 0),
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
      if (esCrypto) {
        usuario.saldoChain = parseFloat((saldoDisponible - costoTotal).toFixed(2));
      } else {
        usuario.saldo = parseFloat((saldoDisponible - costoTotal).toFixed(2));
      }
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

    console.log(`✅ Compra REAL ejecutada - Nuevo saldo ${esCrypto ? 'CHAIN' : 'BE'}: $${esCrypto ? usuario.saldoChain : usuario.saldo}`);

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
      nuevoSaldoChain: parseFloat(usuario.saldoChain || 0),
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

    const esCrypto = String(inversion.symbol || '').includes('/');

    // --- VENTA CRYPTO: Bybit spot + comisión 1.5% ---
    if (esCrypto) {
      const baseSymbol = inversion.symbol.split('/')[0];

      const bybitOrden = await bybitService.placeSpotOrder({
        symbol: `${baseSymbol}USDT`,
        side: 'sell',
        qty: parseFloat(inversion.cantidad),
      });

      // Esperar fill (hasta 10s)
      let filledOrder = null;
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await bybitService.getSpotOrderStatus({
          orderId: bybitOrden.orderId,
          symbol: `${baseSymbol}USDT`,
        });
        if (status && ['Filled', 'PartiallyFilled'].includes(status.orderStatus)) {
          filledOrder = status;
          break;
        }
      }

      const cantidadVendida = filledOrder
        ? parseFloat(filledOrder.cumExecQty || inversion.cantidad)
        : parseFloat(inversion.cantidad);
      const precioVenta = filledOrder
        ? parseFloat(filledOrder.avgPrice || 0)
        : 0;
      const ingresoTotal = parseFloat((precioVenta * cantidadVendida).toFixed(2));
      const comisionMonto = parseFloat((ingresoTotal * COMISION_PCT).toFixed(2));
      const ingresoNeto = parseFloat((ingresoTotal - comisionMonto).toFixed(2));
      const ganancia = parseFloat((ingresoNeto - inversion.costoTotal).toFixed(2));

      console.log(`💵 VENTA BYBIT REAL: ${cantidadVendida} ${inversion.symbol} @ $${precioVenta} = $${ingresoTotal} | Comisión: $${comisionMonto} | Neto: $${ingresoNeto}`);

      const usuario = await User.findByPk(usuarioId);

      await sequelize.transaction(async (t) => {
        inversion.precioVenta = precioVenta;
        inversion.ingresoTotal = ingresoNeto;
        inversion.ganancia = ganancia;
        inversion.estado = 'cerrada';
        inversion.fechaVenta = new Date();
        await inversion.save({ transaction: t });

        usuario.saldoChain = parseFloat((parseFloat(usuario.saldoChain || 0) + ingresoNeto).toFixed(2));
        await usuario.save({ transaction: t });

        await Comision.create({
          usuarioId,
          inversionId: inversion.id,
          tipo: 'venta',
          symbol: inversion.symbol,
          montoBase: ingresoTotal,
          porcentaje: COMISION_PCT * 100,
          montoComision: comisionMonto,
          precioEjecutado: precioVenta,
          cantidadCrypto: cantidadVendida,
          bybitOrderId: bybitOrden.orderId || null,
        }, { transaction: t });
      });

      console.log(`✅ Venta BYBIT REAL ejecutada - Nuevo saldoChain: $${usuario.saldoChain}`);

      return res.json({
        mensaje: `✅ VENTA REAL EJECUTADA EN BYBIT: ${cantidadVendida} ${inversion.symbol}`,
        advertencia: ganancia >= 0
          ? `✅ Ganancia neta: $${ganancia}`
          : `⚠️ Pérdida neta: $${Math.abs(ganancia)}`,
        recibo: {
          operacion: 'VENTA',
          symbol: inversion.symbol,
          cantidad: cantidadVendida,
          precioEjecutado: precioVenta,
          ingresosBrutos: ingresoTotal,
          comisionPct: `${(COMISION_PCT * 100).toFixed(1)}%`,
          comisionUSD: comisionMonto,
          ingresosNetos: ingresoNeto,
          bybitOrderId: bybitOrden.orderId,
          fecha: new Date().toISOString(),
        },
        venta: {
          id: inversion.id,
          symbol: inversion.symbol,
          cantidad: cantidadVendida,
          precioCompra: inversion.precioCompra,
          precioVenta,
          costoTotal: inversion.costoTotal,
          ingresoNeto,
          ganancia,
          porcentajeGanancia: parseFloat(((ganancia / inversion.costoTotal) * 100).toFixed(2)),
          esGanancia: ganancia >= 0,
        },
        nuevoSaldo: usuario.saldo,
        nuevoSaldoChain: parseFloat(usuario.saldoChain || 0),
      });
    }

    // --- VENTA ACCIONES: Alpaca ---
    const orden = await alpacaService.crearOrdenMercado({
      symbol: inversion.symbol,
      cantidad: inversion.cantidad,
      side: 'sell',
      clientOrderId: `be-sell-${usuarioId}-${Date.now()}`,
    });

    const ordenConfirmada = await alpacaService.confirmarOrdenMercado(orden.id);
    const cantidadEjecutada = ordenConfirmada.filledQty || 0;

    if (cantidadEjecutada <= 0) {
      return res.status(400).json({
        mensaje: 'La orden real de venta no se ejecuto. Se mantiene la posición abierta.',
        estadoOrden: ordenConfirmada.status,
        orderId: ordenConfirmada.id,
      });
    }

    const precioVenta = ordenConfirmada.filledAvgPrice || 0;
    const ingresoTotal = parseFloat((precioVenta * cantidadEjecutada).toFixed(2));
    const ganancia = parseFloat((ingresoTotal - inversion.costoTotal).toFixed(2));

    console.log(`💵 VENTA REAL ALPACA: ${cantidadEjecutada} ${inversion.symbol} @ $${precioVenta} = $${ingresoTotal}`);

    inversion.precioVenta = precioVenta;
    inversion.ingresoTotal = ingresoTotal;
    inversion.ganancia = ganancia;
    inversion.estado = 'cerrada';
    inversion.fechaVenta = new Date();
    await inversion.save();

    const usuarioAccion = await User.findByPk(usuarioId);
    usuarioAccion.saldo = parseFloat((parseFloat(usuarioAccion.saldo) + ingresoTotal).toFixed(2));
    await usuarioAccion.save();

    console.log(`✅ Venta REAL Alpaca ejecutada - Nuevo saldo BE: $${usuarioAccion.saldo}`);

    res.json({
      mensaje: `✅ VENTA REAL EJECUTADA EN ALPACA: ${cantidadEjecutada} ${inversion.symbol}`,
      advertencia: ganancia >= 0
        ? `✅ Ganancia real: $${ganancia}`
        : `⚠️ Pérdida real: $${Math.abs(ganancia)}`,
      venta: {
        id: inversion.id,
        symbol: inversion.symbol,
        cantidad: cantidadEjecutada,
        precioCompra: inversion.precioCompra,
        precioVenta: inversion.precioVenta,
        costoTotal: inversion.costoTotal,
        ingresoTotal: inversion.ingresoTotal,
        ganancia: inversion.ganancia,
        porcentajeGanancia: parseFloat(((ganancia / inversion.costoTotal) * 100).toFixed(2)),
        esGanancia: ganancia >= 0,
      },
      nuevoSaldo: usuarioAccion.saldo,
      nuevoSaldoChain: parseFloat(usuarioAccion.saldoChain || 0),
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
    const usuario = await User.findByPk(usuarioId, {
      attributes: ['id', 'alpacaAccountId'],
    });

    const posicionesRaw = await Inversion.findAll({
      where: {
        usuarioId,
        estado: 'abierta',
      },
      order: [['fechaCompra', 'DESC']],
    });

    const { validPositions: posiciones, repairedIds, invalidIds } = await reconcileOpenPositions(posicionesRaw);

    if (repairedIds.length > 0) {
      console.log(`🛠️ Posiciones abiertas reparadas al listar: ${repairedIds.join(', ')}`);
    }

    if (invalidIds.length > 0) {
      console.warn(`⚠️ Posiciones abiertas ocultadas por cantidad inválida: ${invalidIds.join(', ')}`);
    }

    if (posiciones.length === 0 && usuario?.alpacaAccountId) {
      const posicionesBroker = await alpacaService.listarPosicionesCuentaBroker(usuario.alpacaAccountId);
      const valorTotalBroker = posicionesBroker.reduce((sum, pos) => sum + parseFloat(pos.market_value || 0), 0);
      const gananciaTotalBroker = posicionesBroker.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pl || 0), 0);

      return res.json({
        posiciones: posicionesBroker,
        resumen: {
          totalPosiciones: posicionesBroker.length,
          valorTotal: parseFloat(valorTotalBroker.toFixed(2)),
          gananciaTotal: parseFloat(gananciaTotalBroker.toFixed(2)),
        },
        source: 'alpaca',
      });
    }

    // Obtener precios actuales
    const symbols = [...new Set(posiciones.map(p => p.symbol))];
    const cotizaciones = await obtenerCotizacionesResilientes(symbols);

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
        source: 'be',
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
      source: 'local',
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
    const posicionesAbiertasRaw = await Inversion.findAll({
      where: { usuarioId, estado: 'abierta' },
      order: [['fechaCompra', 'DESC']],
    });

    const { validPositions: posicionesAbiertas, repairedIds, invalidIds } = await reconcileOpenPositions(posicionesAbiertasRaw);

    if (repairedIds.length > 0) {
      console.log(`🛠️ Posiciones de portfolio reparadas: ${repairedIds.join(', ')}`);
    }

    if (invalidIds.length > 0) {
      console.warn(`⚠️ Posiciones excluidas del portfolio por cantidad inválida: ${invalidIds.join(', ')}`);
    }

    // Historial cerrado
    const historial = await Inversion.findAll({
      where: { usuarioId, estado: 'cerrada' },
      order: [['fechaVenta', 'DESC']],
      limit: 50,
    });

    // Obtener precios actuales para posiciones abiertas
    const symbols = [...new Set(posicionesAbiertas.map(p => p.symbol))];
    const cotizaciones = symbols.length > 0 
      ? await obtenerCotizacionesResilientes(symbols)
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
      saldoChainDisponible: parseFloat(usuario.saldoChain || 0),
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

    const cotizacion = await obtenerCotizacionResiliente(symbol.toUpperCase());

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

// Obtener P&L actualizado de todas las inversiones abiertas
const obtenerPNLActualizado = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const resultado = await pnlUpdateService.actualizarPNLUsuario({ usuarioId });

    res.json({
      success: true,
      ...resultado,
    });
  } catch (error) {
    console.error('❌ Error obteniendo P&L actualizado:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Obtener historial de comisiones del usuario
const obtenerComisiones = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const comisiones = await Comision.findAll({
      where: { usuarioId },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    const totalComisionado = comisiones.reduce(
      (sum, c) => sum + parseFloat(c.montoComision || 0),
      0,
    );

    res.json({
      comisiones: comisiones.map((c) => ({
        id: c.id,
        tipo: c.tipo,
        symbol: c.symbol,
        montoBase: parseFloat(c.montoBase),
        porcentaje: parseFloat(c.porcentaje),
        montoComision: parseFloat(c.montoComision),
        precioEjecutado: parseFloat(c.precioEjecutado || 0),
        cantidadCrypto: parseFloat(c.cantidadCrypto || 0),
        bybitOrderId: c.bybitOrderId,
        inversionId: c.inversionId,
        fecha: c.createdAt,
      })),
      resumen: {
        totalOperaciones: comisiones.length,
        totalComisionado: parseFloat(totalComisionado.toFixed(2)),
        pctPromedio: `${(COMISION_PCT * 100).toFixed(1)}%`,
      },
    });
  } catch (error) {
    console.error('❌ Error obteniendo comisiones:', error.message);
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
  obtenerPNLActualizado,
  obtenerComisiones,
};
