const BankAccount = require('../models/BankAccount');
const User = require('../models/User');
const Recarga = require('../models/Recarga');
const FundingTransfer = require('../models/FundingTransfer');
const alpacaService = require('../services/alpacaService');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

const ACTIVE_ALPACA_ACCOUNT_STATUSES = new Set(['active', 'approved', 'enabled']);
const TERMINAL_FUNDING_STATUSES = new Set(['settled', 'failed', 'canceled']);

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const toNumberOrZero = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapBankAccountType = (tipoCuenta) => (
  String(tipoCuenta || '').toLowerCase() === 'corriente' ? 'CHECKING' : 'SAVINGS'
);

const mapFundingToCuentaEstado = (status) => {
  if (status === 'settled') return 'verificada';
  if (status === 'failed' || status === 'canceled') return 'fallida';
  return 'pendiente';
};

const mapFundingLifecycleStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();

  if (normalized === 'requested') {
    return 'requested';
  }

  if (normalized === 'queued' || normalized === 'pending') {
    return 'pending';
  }

  if (TERMINAL_FUNDING_STATUSES.has(normalized)) {
    return normalized;
  }

  return 'pending';
};

const buildFundingReference = () => `ALPACA-ACH-${Date.now()}`;

const isSettledFunding = (status) => status === 'settled';
const isFailedFunding = (status) => status === 'failed' || status === 'canceled';

const resolveSourceBalanceField = (sourceBalance) => (
  String(sourceBalance || '').toLowerCase() === 'saldochain' ? 'saldoChain' : 'saldo'
);

const getSaldoLabel = (sourceField) => (sourceField === 'saldoChain' ? 'CHAIN' : 'BE');

const moveSaldoToTransit = (usuario, amount, sourceField = 'saldo') => {
  const monto = toNumberOrZero(amount);
  const saldoDisponible = toNumberOrZero(usuario[sourceField]);
  const saldoEnTransito = toNumberOrZero(usuario.saldoEnTransitoAlpaca);

  if (monto <= 0) {
    throw new Error('Monto invalido para mover a transito');
  }

  if (saldoDisponible < monto) {
    throw new Error(`Saldo ${getSaldoLabel(sourceField)} insuficiente para iniciar funding`);
  }

  usuario[sourceField] = parseFloat((saldoDisponible - monto).toFixed(2));
  usuario.saldoEnTransitoAlpaca = parseFloat((saldoEnTransito + monto).toFixed(2));
};

const releaseTransitToSaldo = (usuario, amount, sourceField = 'saldo') => {
  const monto = toNumberOrZero(amount);
  const saldoDisponible = toNumberOrZero(usuario[sourceField]);
  const saldoEnTransito = toNumberOrZero(usuario.saldoEnTransitoAlpaca);
  const montoLiberado = Math.min(monto, saldoEnTransito);

  if (montoLiberado <= 0) {
    return 0;
  }

  usuario[sourceField] = parseFloat((saldoDisponible + montoLiberado).toFixed(2));
  usuario.saldoEnTransitoAlpaca = parseFloat((saldoEnTransito - montoLiberado).toFixed(2));
  return montoLiberado;
};

const markLedgerReleased = (fundingTransfer, reason) => {
  const metadata = fundingTransfer.metadata && typeof fundingTransfer.metadata === 'object'
    ? { ...fundingTransfer.metadata }
    : {};

  if (!metadata.localLedgerReleasedAt) {
    metadata.localLedgerReleasedAt = new Date().toISOString();
  }
  if (!metadata.localLedgerReleaseReason) {
    metadata.localLedgerReleaseReason = reason;
  }

  fundingTransfer.metadata = metadata;
};

const hasLedgerBeenReleased = (fundingTransfer) => Boolean(
  fundingTransfer.metadata
  && typeof fundingTransfer.metadata === 'object'
  && fundingTransfer.metadata.localLedgerReleasedAt,
);

const ensureUsuarioConCuentaAlpacaActiva = (usuario) => {
  if (!usuario?.alpacaAccountId) {
    throw new Error('El usuario no tiene alpacaAccountId configurado. Configuralo antes de fondear.');
  }

  if (!ACTIVE_ALPACA_ACCOUNT_STATUSES.has(String(usuario.alpacaAccountStatus || '').toLowerCase())) {
    throw new Error('La cuenta Alpaca del usuario no esta activa para funding ACH.');
  }
};

const persistFundingState = async ({
  transaction,
  usuario,
  fundingTransfer,
  recarga,
  newStatus,
  providerStatus,
  responsePayload,
  errorMessage,
}) => {
  const previousStatus = mapFundingLifecycleStatus(fundingTransfer.status);
  const statusCandidate = mapFundingLifecycleStatus(newStatus);
  const status = isSettledFunding(previousStatus) ? 'settled' : statusCandidate;
  const ledgerReleased = hasLedgerBeenReleased(fundingTransfer);
  const sourceField = resolveSourceBalanceField(fundingTransfer?.metadata?.sourceBalance);

  fundingTransfer.status = status;
  fundingTransfer.providerStatus = providerStatus || fundingTransfer.providerStatus;
  fundingTransfer.responsePayload = responsePayload || fundingTransfer.responsePayload;
  fundingTransfer.errorMessage = errorMessage || null;
  fundingTransfer.lastSyncedAt = new Date();

  if (isSettledFunding(status)) {
    fundingTransfer.settledAt = fundingTransfer.settledAt || new Date();

    // Libera el hold local solo una vez al confirmar settlement.
    if (!ledgerReleased) {
      releaseTransitToSaldo(usuario, fundingTransfer.amount, sourceField);
      markLedgerReleased(fundingTransfer, 'settled');
    }

    if (!fundingTransfer.creditedAt) {
      fundingTransfer.creditedAt = new Date();
    }

    if (recarga) {
      recarga.estado = 'exitosa';
      recarga.fechaProcesamiento = recarga.fechaProcesamiento || new Date();
      recarga.mensajeError = null;
    }
  }

  if (isFailedFunding(status)) {
    // Si falla/cancela, se devuelve el hold local al saldo disponible.
    if (!ledgerReleased && !isSettledFunding(previousStatus)) {
      releaseTransitToSaldo(usuario, fundingTransfer.amount, sourceField);
      markLedgerReleased(fundingTransfer, 'failed');
    }

    if (recarga) {
      recarga.estado = 'fallida';
      recarga.mensajeError = errorMessage || `Transferencia ${providerStatus || status}`;
    }
  }

  if (status === 'pending' && recarga && recarga.estado !== 'procesando') {
    recarga.estado = 'procesando';
    recarga.mensajeError = null;
  }

  await fundingTransfer.save({ transaction });
  await usuario.save({ transaction });
  if (recarga) {
    await recarga.save({ transaction });
  }
};

// Vincular cuenta bancaria
const vincularCuenta = async (req, res) => {
  try {
    const {
      nombreCuenta,
      numeroCuenta,
      banco,
      tipoCuenta,
      ruteo,
      processorToken,
      activarAlpacaACH,
      nickname,
    } = req.body;
    const usuarioId = req.usuario.id;

    if (!nombreCuenta || !banco) {
      return res.status(400).json({ mensaje: 'Datos incompletos' });
    }

    const numeroCuentaRaw = String(numeroCuenta || '').trim();
    const ruteoRaw = String(ruteo || '').trim();
    const processorTokenRaw = String(processorToken || '').trim();
    const activarFundingReal = Boolean(activarAlpacaACH || processorTokenRaw);

    const usuario = await User.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    let achRelationship = null;
    let achRelationshipStatus = 'not_configured';
    let cuentaEstado = 'verificada';

    if (activarFundingReal) {
      ensureUsuarioConCuentaAlpacaActiva(usuario);

      if (!processorTokenRaw && (!numeroCuentaRaw || !ruteoRaw)) {
        return res.status(400).json({
          mensaje: 'Para ACH real debes enviar processorToken o numeroCuenta + ruteo.',
        });
      }

      achRelationship = await alpacaService.crearRelacionAchBroker({
        accountId: usuario.alpacaAccountId,
        accountOwnerName: nombreCuenta,
        bankAccountType: mapBankAccountType(tipoCuenta),
        bankAccountNumber: numeroCuentaRaw,
        bankRoutingNumber: ruteoRaw,
        nickname: nickname || banco,
        processorToken: processorTokenRaw || null,
      });

      achRelationshipStatus = achRelationship.status;
      cuentaEstado = mapFundingToCuentaEstado(achRelationship.status);
      if (usuario.alpacaAchEnabledAt == null) {
        usuario.alpacaAchEnabledAt = new Date();
        await usuario.save();
      }
    }

    // Guardar cuenta bancaria
    const cuentaLocal = await BankAccount.create({
      usuarioId,
      bankAccountToken: null,
      nombreCuenta,
      accountHolderName: nombreCuenta,
      numerosCuenta: (numeroCuentaRaw || '0000').slice(-4),
      routingNumber: ruteoRaw || null,
      banco,
      tipoCuenta: tipoCuenta || 'ahorros',
      stripeCustomerId: null,
      stripeBankAccountId: null,
      estado: cuentaEstado,
      fundingSource: processorTokenRaw ? 'plaid' : 'manual',
      alpacaAchRelationshipId: achRelationship?.id || null,
      alpacaAchRelationshipStatus: achRelationshipStatus,
      alpacaProcessorToken: processorTokenRaw || null,
      achRelationshipSyncedAt: achRelationship ? new Date() : null,
    });
    
    console.log(`✅ Cuenta bancaria vinculada: ${banco} - ****${cuentaLocal.numerosCuenta}`);
    console.log(`   Usuario: ${usuario.email} - Retiros via PayPal Payouts`);
    
    return res.json({
      mensaje: 'Cuenta bancaria vinculada exitosamente',
      cuentaId: cuentaLocal.id,
      estado: cuentaLocal.estado,
      banco: cuentaLocal.banco,
      ultimosDigitos: cuentaLocal.numerosCuenta,
      metodoRetiro: 'PayPal Payouts',
      alpacaAch: achRelationship
        ? {
            relationshipId: achRelationship.id,
            status: achRelationship.status,
          }
        : null,
      nota: achRelationship
        ? 'Cuenta vinculada para funding ACH real con Alpaca Broker API.'
        : 'Cuenta local vinculada. Para funding real activa Alpaca ACH en la vinculacion.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verificar cuenta con microdeposits
const verificarCuenta = async (req, res) => {
  try {
    const { cuentaId, deposit1, deposit2 } = req.body;
    const usuarioId = req.usuario.id;

    if (!cuentaId) {
      return res.status(400).json({ mensaje: 'cuentaId es requerido' });
    }

    const cuenta = await BankAccount.findOne({
      where: { id: cuentaId, usuarioId },
    });

    if (!cuenta) {
      return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
    }

    if (cuenta.alpacaAchRelationshipId) {
      if (cuenta.estado !== 'verificada') {
        cuenta.estado = 'verificada';
        cuenta.alpacaAchRelationshipStatus = 'settled';
        cuenta.achRelationshipSyncedAt = new Date();
        await cuenta.save();
      }

      return res.json({
        mensaje: 'Cuenta ACH real ya vinculada en Alpaca',
        cuentaId: cuenta.id,
        estado: cuenta.estado,
        relationshipId: cuenta.alpacaAchRelationshipId,
      });
    }

    if (deposit1 == null || deposit2 == null) {
      return res.status(400).json({ mensaje: 'Datos de verificación incompletos' });
    }

    // Flujo legacy de verificación local
    if (deposit1 < 0.01 || deposit1 > 0.99 || deposit2 < 0.01 || deposit2 > 0.99) {
      return res.status(400).json({ 
        mensaje: 'Montos de depósito inválidos (deben estar entre 0.01 y 0.99)',
      });
    }

    // Validar montos (simulación)
    cuenta.deposit1 = parseFloat(deposit1);
    cuenta.deposit2 = parseFloat(deposit2);
    cuenta.deposit1Verificado = true;
    cuenta.deposit2Verificado = true;
    cuenta.estado = 'verificada';

    await cuenta.save();

    res.json({
      mensaje: 'Cuenta verificada exitosamente',
      cuentaId: cuenta.id,
      estado: 'verificada',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Listar cuentas bancarias del usuario
const listarCuentas = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const cuentas = await BankAccount.findAll({
      where: { usuarioId },
      attributes: [
        'id',
        'nombreCuenta',
        'accountHolderName',
        'numerosCuenta',
        'banco',
        'tipoCuenta',
        'estado',
        'esDefault',
        'fundingSource',
        'alpacaAchRelationshipId',
        'alpacaAchRelationshipStatus',
        'achRelationshipSyncedAt',
        'createdAt',
      ],
      order: [['esDefault', 'DESC'], ['createdAt', 'DESC']],
    });

    res.json(cuentas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Desvincular cuenta
const desvincularCuenta = async (req, res) => {
  try {
    const { cuentaId } = req.body;
    const usuarioId = req.usuario.id;

    const cuenta = await BankAccount.findOne({
      where: { id: cuentaId, usuarioId },
    });

    if (!cuenta) {
      return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
    }

    await cuenta.destroy();

    res.json({
      mensaje: 'Cuenta desvinculada',
      cuentaId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Recargar desde cuenta bancaria
const recargarDesdeBanco = async (req, res) => {
  try {
    const { cuentaId, monto, sourceBalance } = req.body;
    const usuarioId = req.usuario.id;
    const sourceField = resolveSourceBalanceField(sourceBalance);

    const montoNum = toNumber(monto);
    if (!cuentaId || !Number.isFinite(montoNum) || montoNum <= 0) {
      return res.status(400).json({ mensaje: 'Datos incompletos' });
    }

    const cuenta = await BankAccount.findOne({
      where: { id: cuentaId, usuarioId },
    });

    if (!cuenta) {
      return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
    }

    if (cuenta.estado !== 'verificada') {
      return res.status(400).json({ 
        mensaje: 'Cuenta no verificada',
        estado: cuenta.estado,
      });
    }

    if (!cuenta.alpacaAchRelationshipId) {
      return res.status(400).json({
        mensaje: 'La cuenta no tiene relación ACH real en Alpaca. Vincula nuevamente con ACH activo.',
      });
    }

    const usuario = await User.findByPk(usuarioId);
    ensureUsuarioConCuentaAlpacaActiva(usuario);

    const saldoDisponible = toNumberOrZero(usuario[sourceField]);
    if (montoNum > saldoDisponible) {
      return res.status(400).json({
        mensaje: `Saldo ${getSaldoLabel(sourceField)} insuficiente para iniciar funding a Alpaca`,
        saldoDisponible,
        fuenteSaldo: sourceField,
        montoSolicitado: montoNum,
        faltante: parseFloat((montoNum - saldoDisponible).toFixed(2)),
      });
    }

    const numeroReferencia = buildFundingReference();

    let recarga;
    let fundingTransfer;

    await sequelize.transaction(async (transaction) => {
      moveSaldoToTransit(usuario, montoNum, sourceField);
      await usuario.save({ transaction });

      // Ledger local: recarga pendiente
      recarga = await Recarga.create({
        usuarioId,
        monto: montoNum,
        montoNeto: montoNum,
        metodo: 'transferencia',
        estado: 'procesando',
        numeroReferencia,
        descripcion: `Funding BE -> Alpaca desde ${cuenta.banco} (${cuenta.numerosCuenta})`,
      }, { transaction });

      // Ledger de funding para reconciliación
      fundingTransfer = await FundingTransfer.create({
        usuarioId,
        bankAccountId: cuenta.id,
        recargaId: recarga.id,
        alpacaAccountId: usuario.alpacaAccountId,
        alpacaRelationshipId: cuenta.alpacaAchRelationshipId,
        transferType: 'ach',
        direction: 'INCOMING',
        timing: 'immediate',
        amount: montoNum,
        currency: 'USD',
        status: 'requested',
        providerStatus: 'requested',
        numeroReferencia,
        requestPayload: {
          cuentaId,
          relationshipId: cuenta.alpacaAchRelationshipId,
          amount: montoNum,
          direction: 'INCOMING',
          timing: 'immediate',
        },
        metadata: {
          banco: cuenta.banco,
          ultimosDigitos: cuenta.numerosCuenta,
          sourceBalance: sourceField,
          ledgerReservado: true,
          ledgerReservadoAt: new Date().toISOString(),
        },
      }, { transaction });
    });

    let brokerTransfer;
    try {
      brokerTransfer = await alpacaService.transferirFondosAAlpaca({
        accountId: usuario.alpacaAccountId,
        relationshipId: cuenta.alpacaAchRelationshipId,
        monto: montoNum,
      });
    } catch (brokerError) {
      await sequelize.transaction(async (transaction) => {
        await persistFundingState({
          transaction,
          usuario,
          fundingTransfer,
          recarga,
          newStatus: 'failed',
          providerStatus: 'broker_error',
          responsePayload: brokerError.response?.data || null,
          errorMessage: brokerError.message,
        });
      });

      return res.status(400).json({
        mensaje: 'Error procesando funding ACH en Alpaca',
        error: brokerError.message,
        fundingTransferId: fundingTransfer.id,
      });
    }

    fundingTransfer.alpacaTransferId = brokerTransfer.id;
    fundingTransfer.responsePayload = brokerTransfer;
    fundingTransfer.providerStatus = brokerTransfer.statusRaw || brokerTransfer.status;

    await sequelize.transaction(async (transaction) => {
      await persistFundingState({
        transaction,
        usuario,
        fundingTransfer,
        recarga,
        newStatus: brokerTransfer.status,
        providerStatus: brokerTransfer.statusRaw,
        responsePayload: brokerTransfer,
        errorMessage: null,
      });
    });

    const respuesta = {
      mensaje: isSettledFunding(fundingTransfer.status)
        ? 'Funding ACH confirmado y saldo BE liberado para trading'
        : 'Funding ACH enviado a Alpaca. Pendiente de settlement.',
      numeroReferencia,
      fundingTransferId: fundingTransfer.id,
      alpacaTransferId: fundingTransfer.alpacaTransferId,
      estado: fundingTransfer.status,
      providerStatus: fundingTransfer.providerStatus,
      montoSolicitado: montoNum,
      saldoDisponible: parseFloat(usuario[sourceField] || 0),
      fuenteSaldo: sourceField,
      saldoEnTransitoAlpaca: parseFloat(usuario.saldoEnTransitoAlpaca),
    };

    return res.json(respuesta);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const obtenerFundingHistorial = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const transfers = await FundingTransfer.findAll({
      where: { usuarioId },
      order: [['createdAt', 'DESC']],
      limit,
    });

    return res.json(transfers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const sincronizarFundingTransfer = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const fundingTransferId = req.body.fundingTransferId || req.params.fundingTransferId;

    if (!fundingTransferId) {
      return res.status(400).json({ mensaje: 'fundingTransferId requerido' });
    }

    const fundingTransfer = await FundingTransfer.findOne({
      where: { id: fundingTransferId, usuarioId },
    });

    if (!fundingTransfer) {
      return res.status(404).json({ mensaje: 'FundingTransfer no encontrado' });
    }

    if (!fundingTransfer.alpacaTransferId) {
      return res.status(400).json({ mensaje: 'El funding transfer no tiene alpacaTransferId para sincronizar' });
    }

    const usuario = await User.findByPk(usuarioId);
    ensureUsuarioConCuentaAlpacaActiva(usuario);

    const brokerTransfer = await alpacaService.obtenerTransferenciaAchBroker({
      accountId: usuario.alpacaAccountId,
      transferId: fundingTransfer.alpacaTransferId,
    });

    const recarga = fundingTransfer.recargaId
      ? await Recarga.findByPk(fundingTransfer.recargaId)
      : null;

    await sequelize.transaction(async (transaction) => {
      await persistFundingState({
        transaction,
        usuario,
        fundingTransfer,
        recarga,
        newStatus: brokerTransfer.status,
        providerStatus: brokerTransfer.statusRaw,
        responsePayload: brokerTransfer,
        errorMessage: isFailedFunding(brokerTransfer.status)
          ? `Transferencia ${brokerTransfer.statusRaw || brokerTransfer.status}`
          : null,
      });
    });

    return res.json({
      mensaje: 'Funding transfer sincronizado',
      fundingTransfer,
      brokerTransfer,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const sincronizarFundingPendientes = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const usuario = await User.findByPk(usuarioId);
    ensureUsuarioConCuentaAlpacaActiva(usuario);

    const pendientes = await FundingTransfer.findAll({
      where: {
        usuarioId,
        status: { [Op.in]: ['requested', 'pending'] },
      },
      order: [['createdAt', 'ASC']],
      limit: 50,
    });

    const resultados = [];

    for (const fundingTransfer of pendientes) {
      if (!fundingTransfer.alpacaTransferId) {
        continue;
      }

      try {
        const brokerTransfer = await alpacaService.obtenerTransferenciaAchBroker({
          accountId: usuario.alpacaAccountId,
          transferId: fundingTransfer.alpacaTransferId,
        });

        const recarga = fundingTransfer.recargaId
          ? await Recarga.findByPk(fundingTransfer.recargaId)
          : null;

        await sequelize.transaction(async (transaction) => {
          await persistFundingState({
            transaction,
            usuario,
            fundingTransfer,
            recarga,
            newStatus: brokerTransfer.status,
            providerStatus: brokerTransfer.statusRaw,
            responsePayload: brokerTransfer,
            errorMessage: isFailedFunding(brokerTransfer.status)
              ? `Transferencia ${brokerTransfer.statusRaw || brokerTransfer.status}`
              : null,
          });
        });

        resultados.push({
          fundingTransferId: fundingTransfer.id,
          status: fundingTransfer.status,
          providerStatus: fundingTransfer.providerStatus,
        });
      } catch (syncError) {
        resultados.push({
          fundingTransferId: fundingTransfer.id,
          status: 'error',
          error: syncError.message,
        });
      }
    }

    return res.json({
      mensaje: 'Sincronización de pendientes completada',
      total: pendientes.length,
      resultados,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Obtener cuenta default
const obtenerCuentaDefault = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const cuenta = await BankAccount.findOne({
      where: { usuarioId, esDefault: true },
    });

    if (!cuenta) {
      return res.status(404).json({ mensaje: 'No hay cuenta por defecto' });
    }

    res.json(cuenta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Establecer cuenta como default
const establecerDefault = async (req, res) => {
  try {
    const { cuentaId } = req.body;
    const usuarioId = req.usuario.id;

    // Desactivar todas las demás
    await BankAccount.update(
      { esDefault: false },
      { where: { usuarioId } }
    );

    // Activar la seleccionada
    const cuenta = await BankAccount.findOne({
      where: { id: cuentaId, usuarioId },
    });

    if (!cuenta) {
      return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
    }

    cuenta.esDefault = true;
    await cuenta.save();

    res.json({
      mensaje: 'Cuenta establecida como default',
      cuentaId: cuenta.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  vincularCuenta,
  verificarCuenta,
  listarCuentas,
  desvincularCuenta,
  recargarDesdeBanco,
  obtenerFundingHistorial,
  sincronizarFundingTransfer,
  sincronizarFundingPendientes,
  obtenerCuentaDefault,
  establecerDefault,
};
