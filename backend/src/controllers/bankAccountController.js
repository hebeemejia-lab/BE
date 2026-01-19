const BankAccount = require('../models/BankAccount');
const User = require('../models/User');
const Recarga = require('../models/Recarga');
const stripeService = require('../services/stripeService');

// Vincular cuenta bancaria
const vincularCuenta = async (req, res) => {
  try {
    const { nombreCuenta, numeroCuenta, banco, tipoCuenta, ruteo } = req.body;
    const usuarioId = req.usuario.id;

    if (!nombreCuenta || !numeroCuenta || !banco || !ruteo) {
      return res.status(400).json({ mensaje: 'Datos incompletos' });
    }

    const usuario = await User.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Bancos de República Dominicana (no Stripe, solo guardar en BD)
    const bancosRD = [
      'Banreservas',
      'Banco Popular',
      'BHD León',
      'Scotiabank',
      'Banco Caribe',
      'Banco Santa Cruz',
      'Banco López de Haro',
    ];

    if (bancosRD.includes(banco)) {
      // Guardar cuenta local con código SWIFT
      const cuentaLocal = await BankAccount.create({
        usuarioId,
        bankAccountToken: ruteo, // SWIFT code
        nombreCuenta,
        numerosCuenta: numeroCuenta.slice(-4),
        banco,
        tipoCuenta: tipoCuenta || 'ahorros',
        stripeCustomerId: null,
        stripeBankAccountId: null,
        estado: 'pendiente', // Pendiente de verificación manual
      });
      return res.json({
        mensaje: 'Cuenta bancaria vinculada',
        cuentaId: cuentaLocal.id,
        estado: 'pendiente_verificacion',
        proximoPaso: 'Verificación manual o por SWIFT',
      });
    }

    // Bancos internacionales (Stripe, routing number US)
    // Crear o obtener cliente en Stripe
    let stripeCustomerId = usuario.stripeCustomerId;
    if (!stripeCustomerId) {
      const cliente = await stripeService.crearCliente(usuario);
      stripeCustomerId = cliente.id;
      usuario.stripeCustomerId = stripeCustomerId;
      await usuario.save();
    }

    // Crear token de cuenta bancaria
    const token = await stripeService.crearTokenBanco(
      numeroCuenta,
      ruteo,
      nombreCuenta
    );

    if (!token) {
      return res.status(400).json({ mensaje: 'Error creando token de cuenta' });
    }

    // Crear cuenta bancaria en Stripe
    const bankAccount = await stripeService.crearCuentaBancaria(
      stripeCustomerId,
      { token: token.id }
    );

    // Guardar en BD
    const cuentaLocal = await BankAccount.create({
      usuarioId,
      bankAccountToken: token.id,
      nombreCuenta,
      numerosCuenta: numeroCuenta.slice(-4),
      banco,
      tipoCuenta: tipoCuenta || 'ahorros',
      stripeCustomerId,
      stripeBankAccountId: bankAccount.id,
      estado: 'pendiente', // Pendiente de verificación
    });

    res.json({
      mensaje: 'Cuenta bancaria vinculada',
      cuentaId: cuentaLocal.id,
      estado: 'pendiente_verificacion',
      proximoPaso: 'Esperando microdeposits para verificación',
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

    if (!cuentaId || !deposit1 || !deposit2) {
      return res.status(400).json({ mensaje: 'Datos de verificación incompletos' });
    }

    const cuenta = await BankAccount.findOne({
      where: { id: cuentaId, usuarioId },
    });

    if (!cuenta) {
      return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
    }

    // Simular verificación de microdeposits
    // En producción, Stripe mandaría los microdeposits automáticamente
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
      attributes: ['id', 'nombreCuenta', 'numerosCuenta', 'banco', 'tipoCuenta', 'estado', 'esDefault', 'createdAt'],
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
    const { cuentaId, monto } = req.body;
    const usuarioId = req.usuario.id;

    if (!cuentaId || !monto || monto <= 0) {
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

    const usuario = await User.findByPk(usuarioId);

    // Crear registro de recarga
    const recarga = await Recarga.create({
      usuarioId,
      monto,
      montoNeto: monto,
      metodo: 'transferencia',
      estado: 'procesando',
      numeroReferencia: `ACH-${Date.now()}`,
      descripcion: `Recarga desde ${cuenta.banco} (${cuenta.numerosCuenta})`,
    });

    // Simular transferencia ACH
    try {
      // En producción, aquí se procesaría con Stripe ACH
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Actualizar a exitosa
      recarga.estado = 'exitosa';
      recarga.stripePaymentId = `ach_${Date.now()}`;
      await recarga.save();

      // Agregar saldo
      usuario.saldo = parseFloat(usuario.saldo) + monto;
      await usuario.save();

      res.json({
        mensaje: 'Recarga exitosa',
        montoAgregado: monto,
        nuevoSaldo: usuario.saldo,
        numeroReferencia: recarga.numeroReferencia,
      });
    } catch (stripeError) {
      recarga.estado = 'fallida';
      recarga.mensajeError = stripeError.message;
      await recarga.save();

      res.status(400).json({
        mensaje: 'Error procesando recarga',
        error: stripeError.message,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  obtenerCuentaDefault,
  establecerDefault,
};
