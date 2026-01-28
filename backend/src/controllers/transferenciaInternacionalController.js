const User = require('../models/User');
const TransferenciaInternacional = require('../models/TransferenciaInternacional');
const rapydService = require('../services/rapydService');
const { sequelize } = require('../config/database');

// Obtener países soportados
const obtenerPaises = async (req, res) => {
  try {
    console.log('📍 Obteniendo países soportados');
    const paises = await rapydService.getPaises();
    res.json({ paises });
  } catch (error) {
    console.error('❌ Error obteniendo países:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Obtener tasa de cambio
const obtenerTasaCambio = async (req, res) => {
  try {
    const { monedaOrigen, monedaDestino, monto } = req.query;

    if (!monedaOrigen || !monedaDestino || !monto) {
      return res.status(400).json({ mensaje: 'Faltan parámetros requeridos' });
    }

    console.log(`💱 Consultando tasa: ${monto} ${monedaOrigen} → ${monedaDestino}`);
    const tasa = await rapydService.getTasaCambio(monedaOrigen, monedaDestino, monto);

    res.json({ tasa });
  } catch (error) {
    console.error('❌ Error consultando tasa:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Crear transferencia internacional
const crearTransferenciaInternacional = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      paisDestino,
      monedaDestino,
      monto,
      nombreBeneficiario,
      apellidoBeneficiario,
      emailBeneficiario,
      telefonoBeneficiario,
      numeroCuenta,
      codigoBanco,
      tipoCuenta,
      metodoPago,
      descripcion,
    } = req.body;

    const usuarioId = req.usuario.id;

    console.log('🌍 Creando transferencia internacional:', { usuarioId, paisDestino, monto });

    // Validaciones
    if (!paisDestino || !monedaDestino || !monto || !nombreBeneficiario || !apellidoBeneficiario || !numeroCuenta) {
      await transaction.rollback();
      return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }

    if (monto <= 0) {
      await transaction.rollback();
      return res.status(400).json({ mensaje: 'El monto debe ser mayor a 0' });
    }

    // Obtener usuario y verificar saldo
    const usuario = await User.findByPk(usuarioId, { transaction });
    if (!usuario) {
      await transaction.rollback();
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    if (parseFloat(usuario.saldo) < monto) {
      await transaction.rollback();
      return res.status(400).json({ mensaje: 'Saldo insuficiente' });
    }

    // Crear beneficiario en Rapyd
    const beneficiario = await rapydService.crearBeneficiario({
      paisOrigen: 'US',
      monedaOrigen: 'USD',
      paisDestino,
      nombre: nombreBeneficiario,
      apellido: apellidoBeneficiario,
      email: emailBeneficiario,
      telefono: telefonoBeneficiario,
      metodoPago: metodoPago || 'bank',
      tipoCuenta: tipoCuenta || 'checking',
      numeroCuenta,
      codigoBanco,
    });

    console.log('✅ Beneficiario creado:', beneficiario.id);

    // Crear payout en Rapyd
    const payout = await rapydService.crearPayout({
      beneficiaryId: beneficiario.id,
      monto,
      monedaOrigen: 'USD',
      metodoPago: metodoPago || 'bank',
      paisOrigen: 'US',
      descripcion: descripcion || `Transferencia a ${nombreBeneficiario} ${apellidoBeneficiario}`,
      usuarioId,
    });

    console.log('✅ Payout creado:', payout.id);

    // Descontar saldo del usuario
    usuario.saldo = parseFloat(usuario.saldo) - monto;
    await usuario.save({ transaction });

    // Registrar transferencia en BD
    const transferencia = await TransferenciaInternacional.create({
      usuarioId,
      paisDestino,
      monedaDestino,
      monto,
      nombreBeneficiario,
      apellidoBeneficiario,
      emailBeneficiario,
      numeroCuenta,
      codigoBanco,
      metodoPago: metodoPago || 'bank',
      estado: payout.status || 'pendiente',
      rapydPayoutId: payout.id,
      rapydBeneficiaryId: beneficiario.id,
      descripcion: descripcion || `Transferencia a ${nombreBeneficiario}`,
    }, { transaction });

    await transaction.commit();

    console.log('✅ Transferencia internacional creada:', transferencia.id);

    res.status(201).json({
      mensaje: 'Transferencia internacional creada exitosamente',
      transferencia: {
        id: transferencia.id,
        monto: parseFloat(transferencia.monto),
        paisDestino,
        nombreBeneficiario,
        estado: transferencia.estado,
      },
      nuevoSaldo: parseFloat(usuario.saldo),
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error en transferencia internacional:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Obtener historial de transferencias internacionales
const obtenerHistorialInternacional = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    console.log('📋 Consultando historial internacional:', usuarioId);

    const transferencias = await TransferenciaInternacional.findAll({
      where: { usuarioId },
      order: [['createdAt', 'DESC']],
    });

    res.json({ transferencias });
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Consultar estado de transferencia
const consultarEstadoTransferencia = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    console.log('🔍 Consultando estado de transferencia:', id);

    const transferencia = await TransferenciaInternacional.findOne({
      where: { id, usuarioId },
    });

    if (!transferencia) {
      return res.status(404).json({ mensaje: 'Transferencia no encontrada' });
    }

    // Consultar estado en Rapyd
    const estadoRapyd = await rapydService.consultarPayout(transferencia.rapydPayoutId);

    // Actualizar estado en BD si cambió
    if (estadoRapyd.status !== transferencia.estado) {
      transferencia.estado = estadoRapyd.status;
      await transferencia.save();
    }

    res.json({
      transferencia: {
        id: transferencia.id,
        monto: parseFloat(transferencia.monto),
        paisDestino: transferencia.paisDestino,
        nombreBeneficiario: transferencia.nombreBeneficiario,
        estado: transferencia.estado,
        createdAt: transferencia.createdAt,
      },
      estadoDetallado: estadoRapyd,
    });
  } catch (error) {
    console.error('❌ Error consultando estado:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  obtenerPaises,
  obtenerTasaCambio,
  crearTransferenciaInternacional,
  obtenerHistorialInternacional,
  consultarEstadoTransferencia,
};
