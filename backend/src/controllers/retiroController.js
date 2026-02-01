const Recarga = require('../models/Recarga');
const BankAccount = require('../models/BankAccount');
const User = require('../models/User');
const cuentasBancariasConfig = require('../config/cuentasBancariasConfig');
const paypalPayoutsService = require('../services/paypalPayoutsService');

// Procesar retiro automático con PayPal Payouts (DINERO REAL)
const procesarRetiro = async (req, res) => {
  try {
    const { monto, moneda, cuentaId } = req.body;
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

    // Validar email del usuario
    if (!paypalPayoutsService.validarEmail(usuario.email)) {
      return res.status(400).json({ 
        mensaje: 'Email inválido para retiro. Por favor actualiza tu email en el perfil.',
        email: usuario.email,
      });
    }

    const numeroReferencia = `RET-${Date.now()}`;

    try {
      // Procesar PayPal Payout (DINERO REAL)
      console.log(`💰 Procesando retiro PayPal para usuario ${usuarioId}...`);

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
        estado: 'exitosa',
        numeroReferencia,
        descripcion: `Retiro PayPal a ${cuenta.banco} - ${moneda}`,
        numeroTarjeta: cuenta.numerosCuenta,
        stripePaymentId: resultadoPayout.batchId,
        stripeChargeId: resultadoPayout.referencia,
      });

      // Restar dinero del saldo del usuario (DINERO REAL SALE)
      usuario.saldo = saldoDisponible - monto;
      await usuario.save();

      console.log(`✅ Retiro completado: Batch ID ${resultadoPayout.batchId}`);

      return res.json({
        mensaje: 'Retiro procesado exitosamente. Dinero transferido a tu cuenta.',
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
};
