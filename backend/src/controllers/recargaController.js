const Recarga = require('../models/Recarga');
const CodigoRecarga = require('../models/CodigoRecarga');
const User = require('../models/User');
const stripeService = require('../services/stripeService');

// Crear sesión de recarga con Stripe
const crearRecargaStripe = async (req, res) => {
  try {
    const { monto } = req.body;
    const usuarioId = req.usuario.id;

    if (!monto || monto <= 0) {
      return res.status(400).json({ mensaje: 'Monto debe ser mayor a 0' });
    }

    // Crear recarga pendiente en BD
    const recarga = await Recarga.create({
      usuarioId,
      monto,
      montoNeto: monto,
      comision: 0,
      metodo: 'tarjeta',
      estado: 'pendiente',
      numeroReferencia: `REC-${Date.now()}`,
    });

    // Crear sesión de pago con Stripe
    try {
      const session = await stripeService.crearSesionPago(
        monto,
        req.usuario.email,
        {
          recargaId: recarga.id,
          usuarioId,
          concepto: `Recarga de saldo - Ref: ${recarga.numeroReferencia}`,
        }
      );

      res.json({
        mensaje: 'Sesión de pago creada',
        sessionId: session.id,
        recargaId: recarga.id,
        monto: recarga.monto,
        numeroReferencia: recarga.numeroReferencia,
      });
    } catch (stripeError) {
      recarga.estado = 'fallida';
      recarga.mensajeError = stripeError.message;
      await recarga.save();

      res.status(400).json({
        mensaje: 'Error creando sesión de pago',
        error: stripeError.message,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Procesar recarga con tarjeta (Stripe Payment Intent)
const procesarRecargaTarjeta = async (req, res) => {
  try {
    const {
      monto,
      numeroTarjeta,
      nombreTitular,
      mesVencimiento,
      anoVencimiento,
      cvv,
      tipoTarjeta,
      brand,
    } = req.body;
    const usuarioId = req.usuario.id;

    // Validaciones
    if (!monto || monto <= 0) {
      return res.status(400).json({ mensaje: 'Monto debe ser mayor a 0' });
    }

    if (!numeroTarjeta || numeroTarjeta.length < 13) {
      return res.status(400).json({ mensaje: 'Número de tarjeta inválido' });
    }

    if (!mesVencimiento || !anoVencimiento || !cvv || !nombreTitular) {
      return res.status(400).json({ mensaje: 'Datos de tarjeta incompletos' });
    }

    // Crear recarga en BD (estado pendiente)
    const recarga = await Recarga.create({
      usuarioId,
      monto,
      montoNeto: monto,
      comision: 0,
      metodo: 'tarjeta',
      estado: 'procesando',
      numeroReferencia: `REC-${Date.now()}`,
      numeroTarjeta: numeroTarjeta.slice(-4), // Solo últimos 4 dígitos
      descripcion: `${tipoTarjeta === 'credito' ? 'Tarjeta de Crédito' : tipoTarjeta === 'debito' ? 'Tarjeta de Débito' : 'Tarjeta de Ahorros'} ${brand}`,
    });

    try {
      // Crear Payment Intent con Stripe
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_fake');
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(monto * 100), // Convertir a centavos
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {
          recargaId: recarga.id,
          usuarioId,
          tipoTarjeta,
        },
        description: `Recarga de saldo - ${recarga.numeroReferencia}`,
      });

      // Confirmar el pago con tarjeta simulada/mock
      // En producción, el frontend enviaría el token del pago
      if (paymentIntent.client_secret) {
        // Simular aprobación de pago
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Actualizar recarga a exitosa
        recarga.estado = 'exitosa';
        recarga.stripePaymentId = paymentIntent.id;
        recarga.stripeChargeId = `ch_${Date.now()}`;
        await recarga.save();

        // Actualizar saldo del usuario
        const usuario = await User.findByPk(usuarioId);
        usuario.saldo = parseFloat(usuario.saldo) + parseFloat(monto);
        await usuario.save();

        return res.json({
          mensaje: 'Recarga procesada exitosamente',
          montoAgregado: monto,
          nuevoSaldo: parseFloat(usuario.saldo),
          recarga: {
            id: recarga.id,
            numeroReferencia: recarga.numeroReferencia,
            estado: recarga.estado,
            tarjeta: `****${recarga.numeroTarjeta}`,
            tipoTarjeta,
          },
        });
      }
    } catch (stripeError) {
      // En caso de error en Stripe
      recarga.estado = 'fallida';
      recarga.mensajeError = stripeError.message;
      await recarga.save();

      return res.status(400).json({
        mensaje: 'Error procesando pago con tarjeta',
        error: stripeError.message,
        recargaId: recarga.id,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Procesar recarga completada
const procesarRecargaExitosa = async (req, res) => {
  try {
    const { recargaId, stripePaymentId } = req.body;
    const usuarioId = req.usuario.id;

    if (!recargaId || !stripePaymentId) {
      return res.status(400).json({ mensaje: 'Datos faltantes' });
    }

    const recarga = await Recarga.findByPk(recargaId);
    if (!recarga || recarga.usuarioId !== usuarioId) {
      return res.status(404).json({ mensaje: 'Recarga no encontrada' });
    }

    // Actualizar estado de recarga
    recarga.estado = 'exitosa';
    recarga.stripePaymentId = stripePaymentId;
    await recarga.save();

    // Agregar saldo al usuario
    const usuario = await User.findByPk(usuarioId);
    usuario.saldo = parseFloat(usuario.saldo) + parseFloat(recarga.montoNeto);
    await usuario.save();

    res.json({
      mensaje: 'Recarga procesada exitosamente',
      nuevoSaldo: usuario.saldo,
      recarga: {
        id: recarga.id,
        monto: recarga.monto,
        numeroReferencia: recarga.numeroReferencia,
        estado: recarga.estado,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener historial de recargas
const obtenerRecargas = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const recargas = await Recarga.findAll({
      where: { usuarioId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    res.json(recargas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Canjear código de recarga
const canjearcoCodigo = async (req, res) => {
  try {
    const { codigo } = req.body;
    const usuarioId = req.usuario.id;

    if (!codigo) {
      return res.status(400).json({ mensaje: 'Código requerido' });
    }

    const codigoRecarga = await CodigoRecarga.findOne({ where: { codigo } });
    if (!codigoRecarga) {
      return res.status(404).json({ mensaje: 'Código no encontrado' });
    }

    // Validar código
    if (codigoRecarga.estado !== 'activo') {
      return res.status(400).json({ 
        mensaje: `Código ${codigoRecarga.estado}`,
        codigo: codigoRecarga.codigo,
      });
    }

    if (codigoRecarga.fechaExpiracion && new Date() > codigoRecarga.fechaExpiracion) {
      codigoRecarga.estado = 'expirado';
      await codigoRecarga.save();
      return res.status(400).json({ mensaje: 'Código expirado' });
    }

    // Canjear código
    const usuario = await User.findByPk(usuarioId);
    usuario.saldo = parseFloat(usuario.saldo) + parseFloat(codigoRecarga.monto);
    await usuario.save();

    // Actualizar código
    codigoRecarga.estado = 'canjeado';
    codigoRecarga.usuarioId = usuarioId;
    codigoRecarga.fechaCanjeado = new Date();
    await codigoRecarga.save();

    // Crear recarga en historial
    await Recarga.create({
      usuarioId,
      monto: codigoRecarga.monto,
      montoNeto: codigoRecarga.monto,
      metodo: 'codigo',
      estado: 'exitosa',
      numeroReferencia: `COD-${codigoRecarga.codigo}`,
      descripcion: codigoRecarga.descripcion,
    });

    res.json({
      mensaje: 'Código canjeado exitosamente',
      montoAgregado: codigoRecarga.monto,
      nuevoSaldo: usuario.saldo,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generar códigos (admin)
const generarCodigos = async (req, res) => {
  try {
    const { cantidad, monto, fechaExpiracion, descripcion } = req.body;

    if (!cantidad || !monto || cantidad <= 0 || monto <= 0) {
      return res.status(400).json({ mensaje: 'Datos inválidos' });
    }

    const codigos = [];
    for (let i = 0; i < cantidad; i++) {
      const codigo = await CodigoRecarga.create({
        monto,
        fechaExpiracion: fechaExpiracion ? new Date(fechaExpiracion) : null,
        descripcion: descripcion || `Código de recarga $${monto}`,
        createdBy: req.usuario.id, // Asumiendo que hay un usuario admin
      });
      codigos.push({
        id: codigo.id,
        codigo: codigo.codigo,
        monto: codigo.monto,
      });
    }

    res.json({
      mensaje: `${cantidad} códigos generados exitosamente`,
      codigos,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearRecargaStripe,
  procesarRecargaTarjeta,
  procesarRecargaExitosa,
  obtenerRecargas,
  canjearcoCodigo,
  generarCodigos,
};
