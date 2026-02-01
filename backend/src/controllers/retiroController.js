const Recarga = require('../models/Recarga');
const BankAccount = require('../models/BankAccount');
const User = require('../models/User');
const SolicitudRetiroManual = require('../models/SolicitudRetiroManual');
const cuentasBancariasConfig = require('../config/cuentasBancariasConfig');
const paypalPayoutsService = require('../services/paypalPayoutsService');

// Procesar retiro con opciones: PayPal Payout automático o solicitud manual
const procesarRetiro = async (req, res) => {
  try {
    const { monto, moneda, cuentaId, metodoRetiro = 'paypal_payout' } = req.body;
    const usuarioId = req.usuario.id;

    // Validaciones
    if (!monto || monto <= 0) {
      return res.status(400).json({ mensaje: 'Monto debe ser mayor a 0' });
    }

    if (!moneda || !['USD', 'DOP', 'EUR'].includes(moneda)) {
      return res.status(400).json({ mensaje: 'Moneda no válida' });
    }

    if (!cuentaId) {
      return res.status(400).json({ mensaje: 'Cuenta bancaria requerida' });
    }

    if (!['paypal_payout', 'transferencia_manual'].includes(metodoRetiro)) {
      return res.status(400).json({ mensaje: 'Método de retiro no válido' });
    }

    // Verificar usuario y saldo
    const usuario = await User.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const saldoDisponible = parseFloat(usuario.saldo);
    if (monto > saldoDisponible) {
      return res.status(400).json({ 
        mensaje: 'Saldo insuficiente',
        saldoDisponible,
        montoSolicitado: monto,
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

    const numeroReferencia = `RET-${Date.now()}`;

    // OPCIÓN 1: PayPal Payout Automático (LIVE)
    if (metodoRetiro === 'paypal_payout') {
      try {
        // Validar email del usuario
        if (!paypalPayoutsService.validarEmail(usuario.email)) {
          return res.status(400).json({ 
            mensaje: 'Email inválido para PayPal Payout',
            email: usuario.email,
          });
        }

        console.log(`💰 Iniciando PayPal Payout para usuario ${usuarioId}...`);

        // Crear el payout en PayPal
        const resultadoPayout = await paypalPayoutsService.crearPayout({
          monto,
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
          monto,
          montoNeto: monto,
          comision: 0,
          metodo: 'paypal_payout',
          estado: resultadoPayout.estado === 'SUCCESS' ? 'exitosa' : 'procesando',
          numeroReferencia,
          descripcion: `Retiro PayPal a ${cuenta.banco} - ${moneda}`,
          numeroTarjeta: cuenta.numerosCuenta,
          stripePaymentId: resultadoPayout.batchId,
          stripeChargeId: resultadoPayout.referencia,
        });

        // Restar dinero del saldo del usuario
        usuario.saldo = saldoDisponible - monto;
        await usuario.save();

        console.log(`✅ PayPal Payout completado: Batch ID ${resultadoPayout.batchId}`);

        return res.json({
          mensaje: 'Retiro PayPal procesado exitosamente',
          metodo: 'paypal_payout',
          montoRetirado: monto,
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
        console.error('Error en PayPal Payout:', error.message);
        
        // Si falla PayPal, crear solicitud manual en su lugar
        console.log('⚠️  PayPal Payout falló. Creando solicitud de retiro manual...');
        
        const solicitud = await SolicitudRetiroManual.create({
          usuarioId,
          monto,
          moneda,
          metodo: 'paypal_payout',
          estado: 'pendiente',
          nombreUsuario: usuario.nombre,
          emailUsuario: usuario.email,
          cedulaUsuario: usuario.cedula,
          banco: cuenta.banco,
          tipoCuenta: cuenta.tipoCuenta,
          numeroCuenta: cuenta.numerosCuenta,
          nombreBeneficiario: cuenta.nombreCuenta,
          numeroReferencia,
          notasAdmin: `Error en PayPal Payout: ${error.message}. Requiere procesamiento manual.`,
        });

        return res.status(202).json({
          mensaje: 'PayPal Payout falló temporalmente. Se creó solicitud de retiro manual pendiente de aprobación.',
          solicitudId: solicitud.id,
          numeroReferencia,
          estado: 'pendiente_aprobacion',
        });
      }
    }

    // OPCIÓN 2: Solicitud de Retiro Manual
    if (metodoRetiro === 'transferencia_manual') {
      const solicitud = await SolicitudRetiroManual.create({
        usuarioId,
        monto,
        moneda,
        metodo: 'transferencia_manual',
        estado: 'pendiente',
        nombreUsuario: usuario.nombre,
        emailUsuario: usuario.email,
        cedulaUsuario: usuario.cedula,
        banco: cuenta.banco,
        tipoCuenta: cuenta.tipoCuenta,
        numeroCuenta: cuenta.numerosCuenta,
        nombreBeneficiario: cuenta.nombreCuenta,
        numeroReferencia,
        notasAdmin: 'Solicitud manual de retiro. Requiere aprobación del administrador.',
      });

      // Restar dinero del saldo del usuario (se reserva el dinero)
      usuario.saldo = saldoDisponible - monto;
      await usuario.save();

      return res.status(202).json({
        mensaje: 'Solicitud de retiro manual creada. Está pendiente de aprobación del administrador.',
        solicitudId: solicitud.id,
        numeroReferencia: solicitud.numeroReferencia,
        estado: 'pendiente_aprobacion',
        monto,
        moneda,
        cuenta: {
          banco: cuenta.banco,
          numerosCuenta: `****${cuenta.numerosCuenta}`,
        },
      });
    }
  } catch (error) {
    console.error('Error en procesarRetiro:', error);
    res.status(500).json({ error: error.message });
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

// ============ FUNCIONES DE ADMIN PARA RETIROS MANUALES ============

// Obtener todas las solicitudes de retiro manual pendientes
const obtenerSolicitudesRetiroManuales = async (req, res) => {
  try {
    const { estado, usuarioId } = req.query;
    const where = {};

    if (estado) where.estado = estado;
    if (usuarioId) where.usuarioId = usuarioId;

    const solicitudes = await SolicitudRetiroManual.findAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'nombre', 'email', 'cedula', 'saldo'],
      }],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      total: solicitudes.length,
      solicitudes,
    });
  } catch (error) {
    console.error('Error en obtenerSolicitudesRetiroManuales:', error);
    res.status(500).json({ error: error.message });
  }
};

// Aprobar solicitud de retiro y procesar PayPal Payout
const aprobarSolicitudRetiroManual = async (req, res) => {
  try {
    const { solicitudId } = req.params;
    const { notasAdmin } = req.body;
    const adminId = req.usuario.id;

    const solicitud = await SolicitudRetiroManual.findByPk(solicitudId);
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({ 
        mensaje: `No se puede aprobar una solicitud en estado ${solicitud.estado}`,
      });
    }

    const usuario = await User.findByPk(solicitud.usuarioId);

    try {
      // Intentar procesar con PayPal Payout
      if (solicitud.metodo === 'paypal_payout') {
        console.log(`💰 Procesando PayPal Payout aprobado para solicitud ${solicitudId}...`);

        const resultadoPayout = await paypalPayoutsService.crearPayout({
          monto: solicitud.monto,
          currency: solicitud.moneda,
          numeroCuenta: solicitud.numeroCuenta,
          nombreBeneficiario: solicitud.nombreBeneficiario,
          banco: solicitud.banco,
          referencia: solicitud.numeroReferencia,
          email: solicitud.emailUsuario,
        });

        // Actualizar solicitud
        solicitud.estado = 'procesada';
        solicitud.batchIdPayPal = resultadoPayout.batchId;
        solicitud.procesadoPor = adminId;
        solicitud.fechaProcesamiento = new Date();
        solicitud.notasAdmin = notasAdmin || `PayPal Payout procesado - Batch: ${resultadoPayout.batchId}`;
        await solicitud.save();

        // Registrar en tabla Recarga
        await Recarga.create({
          usuarioId: solicitud.usuarioId,
          monto: solicitud.monto,
          montoNeto: solicitud.monto,
          comision: 0,
          metodo: 'paypal_payout',
          estado: 'exitosa',
          numeroReferencia: solicitud.numeroReferencia,
          descripcion: `Retiro PayPal a ${solicitud.banco} - ${solicitud.moneda}`,
          numeroTarjeta: solicitud.numeroCuenta,
          stripePaymentId: resultadoPayout.batchId,
          stripeChargeId: resultadoPayout.referencia,
        });

        return res.json({
          mensaje: 'Solicitud de retiro aprobada y procesada exitosamente',
          solicitud: {
            id: solicitud.id,
            numeroReferencia: solicitud.numeroReferencia,
            estado: solicitud.estado,
            batchIdPayPal: resultadoPayout.batchId,
            monto: solicitud.monto,
            usuario: usuario.nombre,
          },
        });
      }

      // Para transferencias manuales, solo cambiar estado
      solicitud.estado = 'aprobada';
      solicitud.procesadoPor = adminId;
      solicitud.fechaProcesamiento = new Date();
      solicitud.notasAdmin = notasAdmin || 'Aprobada para procesamiento manual';
      await solicitud.save();

      res.json({
        mensaje: 'Solicitud de retiro manual aprobada. Procede con transferencia bancaria manual.',
        solicitud: {
          id: solicitud.id,
          numeroReferencia: solicitud.numeroReferencia,
          estado: solicitud.estado,
          monto: solicitud.monto,
          banco: solicitud.banco,
          numeroCuenta: solicitud.numeroCuenta,
          nombreBeneficiario: solicitud.nombreBeneficiario,
        },
      });
    } catch (error) {
      console.error('Error procesando PayPal Payout:', error.message);

      solicitud.estado = 'rechazada';
      solicitud.razonRechazo = `Error en procesamiento automático: ${error.message}`;
      solicitud.procesadoPor = adminId;
      solicitud.fechaProcesamiento = new Date();
      await solicitud.save();

      return res.status(400).json({
        mensaje: 'No se pudo procesar PayPal Payout. Solicitud rechazada.',
        razonRechazo: error.message,
        solicitudId: solicitud.id,
      });
    }
  } catch (error) {
    console.error('Error en aprobarSolicitudRetiroManual:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rechazar solicitud de retiro y devolver dinero al usuario
const rechazarSolicitudRetiroManual = async (req, res) => {
  try {
    const { solicitudId } = req.params;
    const { razonRechazo } = req.body;
    const adminId = req.usuario.id;

    if (!razonRechazo || razonRechazo.trim().length === 0) {
      return res.status(400).json({ 
        mensaje: 'Debe proporcionar una razón para rechazar la solicitud',
      });
    }

    const solicitud = await SolicitudRetiroManual.findByPk(solicitudId);
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({ 
        mensaje: `No se puede rechazar una solicitud en estado ${solicitud.estado}`,
      });
    }

    const usuario = await User.findByPk(solicitud.usuarioId);

    // Devolver dinero al usuario
    usuario.saldo = parseFloat(usuario.saldo) + parseFloat(solicitud.monto);
    await usuario.save();

    // Actualizar solicitud
    solicitud.estado = 'rechazada';
    solicitud.razonRechazo = razonRechazo;
    solicitud.procesadoPor = adminId;
    solicitud.fechaProcesamiento = new Date();
    await solicitud.save();

    res.json({
      mensaje: 'Solicitud de retiro rechazada. Dinero devuelto al usuario.',
      solicitud: {
        id: solicitud.id,
        numeroReferencia: solicitud.numeroReferencia,
        estado: solicitud.estado,
        razonRechazo: solicitud.razonRechazo,
        montoDevuelto: solicitud.monto,
        nuevoSaldoUsuario: parseFloat(usuario.saldo),
      },
    });
  } catch (error) {
    console.error('Error en rechazarSolicitudRetiroManual:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener estado de una solicitud de retiro
const obtenerEstadoSolicitudRetiro = async (req, res) => {
  try {
    const { solicitudId } = req.params;

    const solicitud = await SolicitudRetiroManual.findByPk(solicitudId, {
      include: [{
        model: User,
        attributes: ['id', 'nombre', 'email'],
      }],
    });

    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    // Si tiene batchIdPayPal, obtener estado de PayPal
    let estadoPayPal = null;
    if (solicitud.batchIdPayPal && solicitud.metodo === 'paypal_payout') {
      try {
        estadoPayPal = await paypalPayoutsService.obtenerEstadoPayout(solicitud.batchIdPayPal);
      } catch (error) {
        console.warn('No se pudo obtener estado de PayPal:', error.message);
      }
    }

    res.json({
      solicitud,
      estadoPayPal,
    });
  } catch (error) {
    console.error('Error en obtenerEstadoSolicitudRetiro:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  procesarRetiro,
  obtenerRetiros,
  obtenerCuentaPrincipal,
  // Funciones de admin para retiros manuales
  obtenerSolicitudesRetiroManuales,
  aprobarSolicitudRetiroManual,
  rechazarSolicitudRetiroManual,
  obtenerEstadoSolicitudRetiro,
};
