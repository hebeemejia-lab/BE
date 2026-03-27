const Recarga = require('../models/Recarga');
const BankAccount = require('../models/BankAccount');
const User = require('../models/User');
const SolicitudRetiroManual = require('../models/SolicitudRetiroManual');
const cuentasBancariasConfig = require('../config/cuentasBancariasConfig');
const bybitService = require('../services/bybitService');
const paypalPayoutsService = require('../services/paypalPayoutsService');
const { calcularComisionRetiro, calcularMontoNeto } = require('../config/comisiones');

const isCryptoWithdrawalRequest = (solicitud) => {
  if (!solicitud) return false;
  if (String(solicitud.banco || '').toUpperCase() === 'CRYPTO_WALLET') return true;
  return String(solicitud.numeroReferencia || '').startsWith('CRYPTO-RET-');
};

const appendAdminNotes = (currentNotes, nextNotes) => {
  const chunks = [String(currentNotes || '').trim(), String(nextNotes || '').trim()].filter(Boolean);
  return chunks.join('\n');
};

const parseSolicitudCryptoMetadata = (solicitud) => {
  const fallback = {
    coin: solicitud?.monedaActiva || solicitud?.nombreBeneficiario || null,
    network: solicitud?.redRetiro || solicitud?.tipoCuenta || null,
    walletAddress: solicitud?.walletAddress || null,
    walletAddressMasked: solicitud?.numeroCuenta || null,
  };

  try {
    const parsed = JSON.parse(solicitud?.notasAdmin || '{}');
    return {
      coin: String(parsed.coin || fallback.coin || '').toUpperCase(),
      network: parsed.network || fallback.network || '',
      walletAddress: parsed.walletAddress || fallback.walletAddress || '',
      walletAddressMasked: parsed.walletAddressMasked || fallback.walletAddressMasked || '',
    };
  } catch (_) {
    return {
      coin: String(fallback.coin || '').toUpperCase(),
      network: fallback.network || '',
      walletAddress: fallback.walletAddress || '',
      walletAddressMasked: fallback.walletAddressMasked || '',
    };
  }
};

const sincronizarEstadoRetiroCryptoBybit = async (solicitud, usuario) => {
  if (!isCryptoWithdrawalRequest(solicitud)) {
    return { solicitud, providerData: null, refunded: false };
  }

  if (String(solicitud.proveedorRetiro || '').toLowerCase() !== 'bybit') {
    return { solicitud, providerData: null, refunded: false };
  }

  const cryptoMeta = parseSolicitudCryptoMetadata(solicitud);
  const providerData = await bybitService.getWithdrawalById({
    withdrawID: solicitud.withdrawalIdExterno,
    coin: cryptoMeta.coin,
    requestId: solicitud.numeroReferencia,
  });

  if (!providerData) {
    return { solicitud, providerData: null, refunded: false };
  }

  const previousState = String(solicitud.estado || '').toLowerCase();
  const nextState = bybitService.mapWithdrawalStatus(providerData.status);
  let refunded = false;

  solicitud.estado = nextState;
  solicitud.txHash = providerData.txID || providerData.txId || providerData.txid || solicitud.txHash;
  solicitud.withdrawalIdExterno = providerData.withdrawId || providerData.id || solicitud.withdrawalIdExterno;
  solicitud.feeActivo = providerData.withdrawFee || providerData.fee || solicitud.feeActivo;

  if (nextState === 'completada') {
    solicitud.fechaProcesamiento = solicitud.fechaProcesamiento || new Date();
  }

  if (nextState === 'fallida' && previousState !== 'fallida' && previousState !== 'rechazada' && previousState !== 'completada') {
    usuario.saldoChain = parseFloat((parseFloat(usuario.saldoChain || 0) + parseFloat(solicitud.monto || 0)).toFixed(2));
    await usuario.save();
    refunded = true;
  }

  await solicitud.save();
  return { solicitud, providerData, refunded };
};

// Procesar retiro automático con PayPal Payouts (DINERO REAL)
const procesarRetiro = async (req, res) => {
  try {
    const { monto, moneda, cuentaId, metodoRetiro } = req.body;
    const usuarioId = req.usuario.id;

    // Validaciones
    if (!monto || monto <= 0) {
      return res.status(400).json({ mensaje: 'Monto debe ser mayor a 0' });
    }

    const montoNumerico = parseFloat(monto);
    const comision = calcularComisionRetiro();
    const montoNeto = calcularMontoNeto(montoNumerico, comision);
    if (montoNeto <= 0) {
      return res.status(400).json({ mensaje: 'Monto insuficiente para cubrir la comisión' });
    }

    if (!moneda || !['USD', 'DOP', 'EUR'].includes(moneda)) {
      return res.status(400).json({ mensaje: 'Moneda no válida' });
    }

    if (!cuentaId) {
      return res.status(400).json({ mensaje: 'Cuenta bancaria requerida' });
    }

    // Verificar usuario y saldo
    const usuario = await User.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const saldoDisponible = parseFloat(usuario.saldo);
    if (montoNumerico > saldoDisponible) {
      return res.status(400).json({ 
        mensaje: 'Saldo insuficiente',
        saldoDisponible,
        montoSolicitado: montoNumerico,
      });
    }

    // Verificar cuenta bancaria
    const cuenta = await BankAccount.findOne({
      where: {
        id: cuentaId,
        usuarioId,
      },
    });

    if (!cuenta) {
      return res.status(404).json({ mensaje: 'Cuenta bancaria no encontrada' });
    }

    if (cuenta.estado !== 'verificada') {
      return res.status(400).json({ 
        mensaje: 'La cuenta no está verificada',
        estado: cuenta.estado,
      });
    }

    // Validar email del usuario
    if (!paypalPayoutsService.validarEmail(usuario.email)) {
      return res.status(400).json({ 
        mensaje: 'Email inválido para retiro. Por favor actualiza tu email en el perfil.',
        email: usuario.email,
      });
    }

    const numeroReferencia = `RET-${Date.now()}`;

    if (metodoRetiro === 'transferencia_manual') {
      const solicitud = await SolicitudRetiroManual.create({
        usuarioId,
        monto: montoNumerico,
        moneda,
        metodo: 'transferencia_manual',
        estado: 'pendiente',
        nombreUsuario: `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim(),
        emailUsuario: usuario.email,
        cedulaUsuario: usuario.cedula,
        banco: cuenta.banco,
        tipoCuenta: cuenta.tipoCuenta,
        numeroCuenta: cuenta.numerosCuenta,
        nombreBeneficiario: cuenta.nombreCuenta,
        numeroReferencia,
      });

      return res.json({
        mensaje: 'Solicitud de retiro manual creada. En espera de aprobacion.',
        solicitudId: solicitud.id,
        numeroReferencia,
        estado: solicitud.estado,
        monto: montoNumerico,
      });
    }

    try {
      // Procesar PayPal Payout (DINERO REAL)
      console.log(`💰 Procesando retiro PayPal para usuario ${usuarioId}...`);

      const resultadoPayout = await paypalPayoutsService.crearPayout({
        monto: montoNeto,
        currency: moneda,
        numeroCuenta: cuenta.numerosCuenta,
        nombreBeneficiario: cuenta.nombreCuenta,
        banco: cuenta.banco,
        referencia: numeroReferencia,
        email: usuario.email,
      });

      // Crear registro en tabla Recarga
      const retiro = await Recarga.create({
        usuarioId,
        monto: montoNumerico,
        montoNeto,
        comision,
        metodo: 'paypal_payout',
        estado: 'exitosa',
        numeroReferencia,
        descripcion: `Retiro PayPal a ${cuenta.banco} - ${moneda}`,
        numeroTarjeta: cuenta.numerosCuenta,
        stripePaymentId: resultadoPayout.batchId,
        stripeChargeId: resultadoPayout.referencia,
      });

      // Restar dinero del saldo del usuario (DINERO REAL SALE)
      usuario.saldo = saldoDisponible - montoNumerico;
      await usuario.save();

      console.log(`✅ Retiro completado: Batch ID ${resultadoPayout.batchId}`);

      return res.json({
        mensaje: 'Retiro procesado exitosamente. Dinero transferido a tu cuenta.',
        metodo: 'paypal_payout',
        montoRetirado: montoNumerico,
        montoNeto,
        comision,
        nuevoSaldo: parseFloat(usuario.saldo),
        retiro: {
          id: retiro.id,
          numeroReferencia: retiro.numeroReferencia,
          batchIdPayPal: resultadoPayout.batchId,
          estado: retiro.estado,
          moneda,
          cuenta: {
            banco: cuenta.banco,
            nombreCuenta: cuenta.nombreCuenta,
            numerosCuenta: `****${cuenta.numerosCuenta}`,
          },
          fechaProcessamiento: new Date(),
        },
      });
    } catch (error) {
      console.error('❌ Error en PayPal Payout:', error.message);
      
      return res.status(400).json({
        mensaje: 'Error procesando retiro. Por favor intenta de nuevo o contacta a soporte.',
        error: error.message,
        numeroReferencia,
      });
    }
  } catch (error) {
    console.error('Error en procesarRetiro:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener solicitudes pendientes de retiro manual (admin)
const obtenerSolicitudesRetiroManuales = async (req, res) => {
  try {
    const { estado } = req.query;
    const where = estado ? { estado } : undefined;
    const solicitudes = await SolicitudRetiroManual.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      exito: true,
      total: solicitudes.length,
      solicitudes,
    });
  } catch (error) {
    console.error('❌ Error obteniendo solicitudes de retiro:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener solicitudes de retiro',
      error: error.message,
    });
  }
};

// Obtener estado de una solicitud específica (admin)
const obtenerEstadoSolicitudRetiro = async (req, res) => {
  try {
    const { solicitudId } = req.params;
    const solicitud = await SolicitudRetiroManual.findByPk(solicitudId);

    if (!solicitud) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Solicitud no encontrada',
      });
    }

    let estadoPayPal = null;
    let estadoBybit = null;
    if (solicitud.batchIdPayPal) {
      try {
        estadoPayPal = await paypalPayoutsService.obtenerEstadoPayout(solicitud.batchIdPayPal);
      } catch (error) {
        estadoPayPal = { error: error.message };
      }
    }

    if (isCryptoWithdrawalRequest(solicitud) && String(solicitud.proveedorRetiro || '').toLowerCase() === 'bybit') {
      try {
        const usuario = await User.findByPk(solicitud.usuarioId);
        const resultadoSync = await sincronizarEstadoRetiroCryptoBybit(solicitud, usuario);
        estadoBybit = resultadoSync.providerData;
      } catch (error) {
        estadoBybit = { error: error.message };
      }
    }

    return res.json({
      exito: true,
      solicitud,
      estadoPayPal,
      estadoBybit,
    });
  } catch (error) {
    console.error('❌ Error obteniendo estado de retiro:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener estado de retiro',
      error: error.message,
    });
  }
};

// Aprobar solicitud de retiro manual (admin)
const aprobarSolicitudRetiroManual = async (req, res) => {
  try {
    const { solicitudId } = req.params;
    const { notasAdmin } = req.body || {};
    const adminId = req.usuario?.id;

    const solicitud = await SolicitudRetiroManual.findByPk(solicitudId);
    if (!solicitud) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Solicitud no encontrada',
      });
    }

    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({
        exito: false,
        mensaje: `La solicitud ya fue ${solicitud.estado}`,
      });
    }

    const usuario = await User.findByPk(solicitud.usuarioId);
    if (!usuario) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado para la solicitud',
      });
    }

    const esRetiroCrypto = isCryptoWithdrawalRequest(solicitud);
    const saldoActual = parseFloat(esRetiroCrypto ? (usuario.saldoChain || 0) : (usuario.saldo || 0));
    const montoSolicitud = parseFloat(solicitud.monto || 0);
    if (montoSolicitud <= 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Monto de solicitud invalido',
      });
    }

    if (montoSolicitud > saldoActual) {
      return res.status(400).json({
        exito: false,
        mensaje: esRetiroCrypto
          ? 'Saldo CHAIN insuficiente para aprobar el retiro'
          : 'Saldo insuficiente para aprobar el retiro',
        saldoActual,
        montoSolicitud,
      });
    }

    if (esRetiroCrypto) {
      const cryptoMeta = parseSolicitudCryptoMetadata(solicitud);
      if (!cryptoMeta.coin || !cryptoMeta.walletAddress || !cryptoMeta.network) {
        return res.status(400).json({
          exito: false,
          mensaje: 'La solicitud crypto no tiene coin, red o wallet completos.',
        });
      }

      const quote = await bybitService.getSpotPriceUsd(cryptoMeta.coin);
      const montoActivo = parseFloat((montoSolicitud / quote.price).toFixed(8));
      if (!Number.isFinite(montoActivo) || montoActivo <= 0) {
        return res.status(400).json({
          exito: false,
          mensaje: 'No se pudo calcular el monto del activo a retirar en Bybit.',
        });
      }

      const bybitWithdrawal = await bybitService.createWithdrawal({
        coin: cryptoMeta.coin,
        chain: cryptoMeta.network,
        address: cryptoMeta.walletAddress,
        amount: montoActivo,
        requestId: solicitud.numeroReferencia,
      });

      usuario.saldoChain = saldoActual - montoSolicitud;
      await usuario.save();

      solicitud.estado = 'enviada';
      solicitud.notasAdmin = appendAdminNotes(solicitud.notasAdmin, notasAdmin);
      solicitud.proveedorRetiro = 'bybit';
      solicitud.procesadoPor = adminId || null;
      solicitud.fechaProcesamiento = new Date();
      solicitud.monedaActiva = cryptoMeta.coin;
      solicitud.redRetiro = bybitService.normalizeChain(cryptoMeta.network, cryptoMeta.coin);
      solicitud.walletAddress = cryptoMeta.walletAddress;
      solicitud.montoActivo = montoActivo;
      solicitud.precioReferenciaUsd = quote.price;
      solicitud.withdrawalIdExterno = bybitWithdrawal.result?.id || bybitWithdrawal.result?.withdrawId || bybitWithdrawal.requestId;
      solicitud.txHash = bybitWithdrawal.result?.txID || bybitWithdrawal.result?.txId || solicitud.txHash;
      await solicitud.save();

      return res.json({
        exito: true,
        mensaje: 'Solicitud crypto enviada a Bybit y saldo CHAIN descontado',
        solicitud,
        nuevoSaldo: parseFloat(usuario.saldoChain || 0),
        saldoAfectado: 'saldoChain',
        retiroProveedor: {
          proveedor: 'bybit',
          withdrawalId: solicitud.withdrawalIdExterno,
          coin: solicitud.monedaActiva,
          chain: solicitud.redRetiro,
          amountAsset: solicitud.montoActivo,
          precioReferenciaUsd: solicitud.precioReferenciaUsd,
        },
      });
    } else {
      usuario.saldo = saldoActual - montoSolicitud;
      await usuario.save();

      solicitud.estado = 'procesada';
      solicitud.notasAdmin = notasAdmin || null;
      solicitud.procesadoPor = adminId || null;
      solicitud.fechaProcesamiento = new Date();
      await solicitud.save();
    }

    return res.json({
      exito: true,
      mensaje: 'Solicitud aprobada y saldo descontado',
      solicitud,
      nuevoSaldo: esRetiroCrypto ? parseFloat(usuario.saldoChain || 0) : parseFloat(usuario.saldo || 0),
      saldoAfectado: esRetiroCrypto ? 'saldoChain' : 'saldo',
    });
  } catch (error) {
    console.error('❌ Error aprobando solicitud de retiro:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al aprobar solicitud',
      error: error.message,
    });
  }
};

const sincronizarSolicitudRetiroBybit = async (req, res) => {
  try {
    const { solicitudId } = req.params;
    const solicitud = await SolicitudRetiroManual.findByPk(solicitudId);

    if (!solicitud) {
      return res.status(404).json({ exito: false, mensaje: 'Solicitud no encontrada' });
    }

    if (!isCryptoWithdrawalRequest(solicitud) || String(solicitud.proveedorRetiro || '').toLowerCase() !== 'bybit') {
      return res.status(400).json({ exito: false, mensaje: 'La solicitud no está asociada a Bybit' });
    }

    const usuario = await User.findByPk(solicitud.usuarioId);
    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado para la solicitud' });
    }

    const resultadoSync = await sincronizarEstadoRetiroCryptoBybit(solicitud, usuario);
    return res.json({
      exito: true,
      mensaje: 'Solicitud sincronizada con Bybit',
      solicitud: resultadoSync.solicitud,
      estadoBybit: resultadoSync.providerData,
      saldoRevertido: resultadoSync.refunded,
      nuevoSaldoChain: parseFloat(usuario.saldoChain || 0),
    });
  } catch (error) {
    console.error('❌ Error sincronizando retiro Bybit:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al sincronizar retiro Bybit',
      error: error.message,
    });
  }
};

// Rechazar solicitud de retiro manual (admin)
const rechazarSolicitudRetiroManual = async (req, res) => {
  try {
    const { solicitudId } = req.params;
    const { razonRechazo } = req.body || {};
    const adminId = req.usuario?.id;

    if (!razonRechazo) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe proporcionar una razon de rechazo',
      });
    }

    const solicitud = await SolicitudRetiroManual.findByPk(solicitudId);
    if (!solicitud) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Solicitud no encontrada',
      });
    }

    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({
        exito: false,
        mensaje: `La solicitud ya fue ${solicitud.estado}`,
      });
    }

    solicitud.estado = 'rechazada';
    solicitud.razonRechazo = razonRechazo;
    solicitud.procesadoPor = adminId || null;
    solicitud.fechaProcesamiento = new Date();
    await solicitud.save();

    return res.json({
      exito: true,
      mensaje: 'Solicitud rechazada',
      solicitud,
    });
  } catch (error) {
    console.error('❌ Error rechazando solicitud de retiro:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al rechazar solicitud',
      error: error.message,
    });
  }
};

// Obtener historial de retiros
const obtenerRetiros = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const retiros = await Recarga.findAll({
      where: {
        usuarioId,
        metodo: 'retiro',
      },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    res.json(retiros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener cuenta bancaria predeterminada para retiros
const obtenerCuentaPrincipal = async (req, res) => {
  try {
    const cuentaPrincipal = cuentasBancariasConfig.principal;

    res.json({
      mensaje: 'Cuenta bancaria principal para retiros',
      cuenta: {
        banco: cuentaPrincipal.banco,
        tipoCuenta: cuentaPrincipal.tipoCuenta,
        numeroCuenta: cuentaPrincipal.numeroCuenta,
        nombreTitular: cuentaPrincipal.nombreTitular,
        email: cuentaPrincipal.email,
        telefono: cuentaPrincipal.telefono,
        monedas: cuentaPrincipal.monedas,
        descripcion: cuentaPrincipal.descripcion,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  procesarRetiro,
  obtenerRetiros,
  obtenerCuentaPrincipal,
  obtenerSolicitudesRetiroManuales,
  obtenerEstadoSolicitudRetiro,
  aprobarSolicitudRetiroManual,
  rechazarSolicitudRetiroManual,
  sincronizarSolicitudRetiroBybit,
};
