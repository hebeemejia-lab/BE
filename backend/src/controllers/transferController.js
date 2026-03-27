const Transfer = require('../models/Transfer');
const TransferenciaBancaria = require('../models/TransferenciaBancaria');
const SolicitudRetiroManual = require('../models/SolicitudRetiroManual');
const User = require('../models/User');
const stripeService = require('../services/stripeService');
const bybitService = require('../services/bybitService');
const { getAvailableCryptoBalance } = require('../services/cryptoHoldingsService');

const TRANSFER_SAFE_ATTRS = ['id', 'nombre', 'apellido', 'email', 'cedula', 'saldo', 'saldoChain', 'rol'];
const ADMIN_ID = 1; // Used as placeholder destinatario for crypto withdrawals

// Realizar transferencia
const realizarTransferencia = async (req, res) => {
  try {
    const { cedula_destinatario, wallet_id, monto, concepto } = req.body;
    const usuarioId = req.usuario.id;

    if ((!cedula_destinatario && !wallet_id) || !monto || monto <= 0) {
      return res.status(400).json({ mensaje: 'Datos de transferencia inválidos' });
    }

    const usuario = await User.findByPk(usuarioId, { attributes: TRANSFER_SAFE_ATTRS });
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    if (parseFloat(usuario.saldo) < monto) {
      return res.status(400).json({ mensaje: 'Saldo insuficiente' });
    }

    let destinatario;
    if (wallet_id) {
      // wallet_id format: BE-000001 → parse numeric ID
      const cleanId = String(wallet_id).toUpperCase().replace(/^BE-0*/i, '');
      const idNum = cleanId ? parseInt(cleanId, 10) : NaN;
      if (!Number.isFinite(idNum) || idNum < 1) {
        return res.status(400).json({ mensaje: 'ID de wallet inválido. Formato: BE-XXXXXX' });
      }
      destinatario = await User.findByPk(idNum, { attributes: TRANSFER_SAFE_ATTRS });
    } else {
      destinatario = await User.findOne({
        where: { cedula: cedula_destinatario },
        attributes: TRANSFER_SAFE_ATTRS,
      });
    }

    if (!destinatario) {
      return res.status(404).json({ mensaje: 'Usuario destinatario no encontrado' });
    }

    if (usuario.id === destinatario.id) {
      return res.status(400).json({ mensaje: 'No puedes transferir a tu propia cuenta' });
    }

    usuario.saldo = parseFloat(usuario.saldo) - monto;
    destinatario.saldo = parseFloat(destinatario.saldo) + monto;

    await usuario.save();
    await destinatario.save();

    const transferencia = await Transfer.create({
      remitenteId: usuario.id,
      destinatarioId: destinatario.id,
      monto,
      concepto: concepto || 'Transferencia bancaria',
      estado: 'exitosa',
    });

    res.status(201).json({
      mensaje: 'Transferencia realizada exitosamente',
      transferencia: {
        id: transferencia.id,
        monto: transferencia.monto,
        destinatario: destinatario.nombre,
        concepto: transferencia.concepto,
        fecha: transferencia.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Solicitar retiro a wallet externa (crypto)
const solicitarRetiroCrypto = async (req, res) => {
  try {
    const { walletAddress, coin, network, monto } = req.body;
    const usuarioId = req.usuario.id;

    if (!walletAddress || !coin || !network || !monto || Number(monto) <= 0) {
      return res.status(400).json({ mensaje: 'Datos del retiro incompletos.' });
    }

    const direccion = String(walletAddress).trim();
    if (direccion.length < 20 || direccion.length > 200) {
      return res.status(400).json({ mensaje: 'Dirección de wallet inválida.' });
    }

    const montoActivo = parseFloat(monto);
    const usuario = await User.findByPk(usuarioId, { attributes: TRANSFER_SAFE_ATTRS });
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });

    const coinUpper = String(coin).toUpperCase();
    const saldoActivoDisponible = await getAvailableCryptoBalance({ usuarioId, coin: coinUpper });
    if (saldoActivoDisponible < montoActivo) {
      return res.status(400).json({
        mensaje: `Saldo insuficiente de ${coinUpper} para el retiro.`,
        coin: coinUpper,
        saldoActivoDisponible,
        montoSolicitado: montoActivo,
      });
    }

    if (usuarioId === ADMIN_ID) {
      return res.status(400).json({ mensaje: 'Operación no permitida.' });
    }

    const maskedAddr = `${direccion.slice(0, 6)}...${direccion.slice(-4)}`;
    const quote = await bybitService.getSpotPriceUsd(coinUpper);
    const montoUsd = parseFloat((montoActivo * quote.price).toFixed(2));

    const numeroReferencia = `CRYPTO-RET-${Date.now()}`;
    const metadataRetiro = JSON.stringify({
      tipo: 'crypto_wallet',
      walletAddress: direccion,
      walletAddressMasked: maskedAddr,
      coin: coinUpper,
      network: String(network),
      montoUsd,
      montoActivo,
      precioReferenciaUsd: quote.price,
      consumedLots: [],
      adminNotes: [],
    });

    const solicitud = await SolicitudRetiroManual.create({
      usuarioId,
      monto: montoUsd,
      moneda: 'USD',
      metodo: 'crypto_bybit',
      estado: 'pendiente',
      nombreUsuario: `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim(),
      emailUsuario: usuario.email,
      cedulaUsuario: usuario.cedula,
      banco: 'CRYPTO_WALLET',
      tipoCuenta: String(network).slice(0, 50),
      numeroCuenta: maskedAddr,
      nombreBeneficiario: coinUpper,
      numeroReferencia,
      proveedorRetiro: 'bybit',
      monedaActiva: coinUpper,
      redRetiro: String(network).slice(0, 50),
      walletAddress: direccion,
      montoActivo,
      precioReferenciaUsd: quote.price,
      notasAdmin: metadataRetiro,
    });

    res.status(201).json({
      mensaje: `Retiro de ${montoActivo} ${coinUpper} solicitado. En espera de aprobación admin.`,
      solicitudId: solicitud.id,
      numeroReferencia,
      estado: solicitud.estado,
      monto: montoActivo,
      montoUsd,
      coin: coinUpper,
      network,
      walletAddress: maskedAddr,
      saldoActivoDisponible,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const obtenerHistorial = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const transferencias = await Transfer.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { remitenteId: usuarioId },
          { destinatarioId: usuarioId },
        ],
      },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const resultado = await Promise.all(transferencias.map(async (trans) => {
      const remitente = await User.findByPk(trans.remitenteId, { attributes: ['nombre', 'email'] });
      const destinatario = await User.findByPk(trans.destinatarioId, { attributes: ['nombre', 'email'] });
      return {
        ...trans.toJSON(),
        remitente,
        destinatario,
      };
    }));

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener transferencias enviadas
const obtenerEnviadas = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const transferencias = await Transfer.findAll({
      where: { remitenteId: usuarioId },
      order: [['createdAt', 'DESC']],
    });

    const resultado = await Promise.all(transferencias.map(async (trans) => {
      const destinatario = await User.findByPk(trans.destinatarioId, { attributes: ['nombre', 'email', 'cedula'] });
      return {
        ...trans.toJSON(),
        destinatario,
      };
    }));

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener transferencias recibidas
const obtenerRecibidas = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const transferencias = await Transfer.findAll({
      where: { destinatarioId: usuarioId },
      order: [['createdAt', 'DESC']],
    });

    const resultado = await Promise.all(transferencias.map(async (trans) => {
      const remitente = await User.findByPk(trans.remitenteId, { attributes: ['nombre', 'email', 'cedula'] });
      return {
        ...trans.toJSON(),
        remitente,
      };
    }));

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Transferencia a cuenta bancaria externa
const transferenciaBancaria = async (req, res) => {
  try {
    const { monto, nombreCuenta, numeroCuenta, banco, tipoCuenta, concepto } = req.body;
    const usuarioId = req.usuario.id;

    // Validaciones
    if (!monto || !nombreCuenta || !numeroCuenta || !banco) {
      return res.status(400).json({ mensaje: 'Todos los datos de la transferencia son requeridos' });
    }

    if (monto <= 0) {
      return res.status(400).json({ mensaje: 'El monto debe ser mayor a 0' });
    }

    const usuario = await User.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    if (parseFloat(usuario.saldo) < monto) {
      return res.status(400).json({ mensaje: 'Saldo insuficiente para realizar la transferencia' });
    }

    // Crear registro de transferencia bancaria
    const transferencia = await TransferenciaBancaria.create({
      usuarioId,
      monto,
      nombreCuenta,
      numeroCuenta,
      banco,
      tipoCuenta: tipoCuenta || 'ahorros',
      concepto: concepto || 'Transferencia bancaria',
      estado: 'procesando',
      codigoReferencia: `TRF-${Date.now()}`,
    });

    // Procesar con Stripe (simulado)
    try {
      // En producción, aquí se integraría directamente con Stripe
      // Para demostración, simulamos el procesamiento
      
      // Simular procesamiento exitoso
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Actualizar estado a exitosa
      transferencia.estado = 'exitosa';
      transferencia.stripePaymentId = `stripe_${Date.now()}`;
      await transferencia.save();

      // Restar saldo del usuario
      usuario.saldo = parseFloat(usuario.saldo) - monto;
      await usuario.save();

      res.status(201).json({
        mensaje: 'Transferencia bancaria procesada exitosamente',
        transferencia: {
          id: transferencia.id,
          monto: transferencia.monto,
          banco: transferencia.banco,
          numeroCuenta: transferencia.numeroCuenta,
          estado: transferencia.estado,
          codigoReferencia: transferencia.codigoReferencia,
          fecha: transferencia.createdAt,
        },
      });
    } catch (stripeError) {
      transferencia.estado = 'fallida';
      transferencia.mensajeError = stripeError.message;
      await transferencia.save();

      res.status(400).json({
        mensaje: 'Error procesando la transferencia bancaria',
        error: stripeError.message,
        codigoReferencia: transferencia.codigoReferencia,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  realizarTransferencia,
  obtenerHistorial,
  obtenerEnviadas,
  obtenerRecibidas,
  transferenciaBancaria,
  solicitarRetiroCrypto,
};
