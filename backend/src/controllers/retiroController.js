const Recarga = require('../models/Recarga');
const BankAccount = require('../models/BankAccount');
const User = require('../models/User');
const cuentasBancariasConfig = require('../config/cuentasBancariasConfig');

// Procesar retiro
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

    // Crear registro de retiro (usando tabla Recarga con metodo='retiro')
    const numeroReferencia = `RET-${Date.now()}`;
    
    const retiro = await Recarga.create({
      usuarioId,
      monto,
      montoNeto: monto,
      comision: 0,
      metodo: 'retiro',
      estado: 'procesando',
      numeroReferencia,
      descripcion: `Retiro a ${cuenta.banco} - ${moneda}`,
      numeroTarjeta: cuenta.numerosCuenta, // Referencia de cuenta
      stripePaymentId: `ACH-${Date.now()}`,
    });

    // Simular procesamiento ACH (1-2 segundos)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Actualizar estado a exitoso
    retiro.estado = 'exitosa';
    retiro.stripeChargeId = `ach_${Date.now()}`;
    await retiro.save();

    // Restar dinero del saldo del usuario
    usuario.saldo = saldoDisponible - monto;
    await usuario.save();

    res.json({
      mensaje: 'Retiro procesado exitosamente',
      montoRetirado: monto,
      nuevoSaldo: parseFloat(usuario.saldo),
      retiro: {
        id: retiro.id,
        numeroReferencia: retiro.numeroReferencia,
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
