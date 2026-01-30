const Recarga = require('../models/Recarga');
const CodigoRecarga = require('../models/CodigoRecarga');
const User = require('../models/User');
const stripeService = require('../services/stripeService');
const rapydService = require('../services/rapydService');

console.log('✅ RecargaController loaded - v2.1 with Rapyd support');

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

// Crear recarga con Rapyd (permite dinero real)
const crearRecargaRapyd = async (req, res) => {
  try {
    const { monto } = req.body;
    const usuarioId = req.usuario.id;
    const usuario = await User.findByPk(usuarioId);

    if (!monto || monto <= 0) {
      return res.status(400).json({ mensaje: 'Monto debe ser mayor a 0' });
    }

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Crear recarga pendiente en BD
    const recarga = await Recarga.create({
      usuarioId,
      monto,
      montoNeto: monto,
      comision: 0,
      metodo: 'rapyd',
      estado: 'pendiente',
      numeroReferencia: `REC-${Date.now()}`,
    });

    try {
      // Crear pago con Rapyd
      const pago = await rapydService.crearPagoRecarga({
        monto,
        email: usuario.email,
        nombre: usuario.nombre || 'Usuario',
        apellido: usuario.apellido || 'Banco Exclusivo',
        usuarioId,
        pais: usuario.pais || 'US',
      });

      console.log('✅ Checkout Rapyd creado:', pago);

      // Rapyd devuelve checkout_url donde el cliente puede pagar
      if (!pago.checkout_url) {
        throw new Error('Rapyd no proporcionó URL de checkout. Verifica tus credenciales y configuración.');
      }

      // Guardar referencia de Rapyd en la recarga
      recarga.rapydCheckoutId = pago.id;
      recarga.rapydCheckoutUrl = pago.checkout_url;
      await recarga.save();

      res.json({
        mensaje: 'Pago Rapyd creado exitosamente',
        checkoutUrl: pago.checkout_url,
        checkoutId: pago.id,
        recargaId: recarga.id,
        monto: recarga.monto,
        numeroReferencia: recarga.numeroReferencia,
      });
    } catch (rapydError) {
      recarga.estado = 'fallida';
      recarga.mensajeError = rapydError.message;
      await recarga.save();

      console.error('❌ Error Rapyd:', rapydError);
      res.status(400).json({
        mensaje: 'Error creando pago Rapyd',
        error: rapydError.message,
        detalles: 'Verifica que tus credenciales de Rapyd estén configuradas correctamente en el archivo .env'
      });
    }
  } catch (error) {
    console.error('❌ Error en crearRecargaRapyd:', error);
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


// Recarga con 2Checkout Inline
// const twoCheckoutService = require('../services/twoCheckoutService');

const crearRecargaTwoCheckout = async (req, res) => {
  try {
    const { monto } = req.body;
    const usuarioId = req.usuario.id;
    
    if (!monto || monto <= 0) {
      return res.status(400).json({ mensaje: 'Monto debe ser mayor a 0' });
    }

    const user = await User.findByPk(usuarioId);
    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Crear recarga pendiente en BD
    const recarga = await Recarga.create({
      usuarioId,
      monto,
      montoNeto: monto,
      comision: 0,
      metodo: '2checkout',
      estado: 'pendiente',
      numeroReferencia: `2CO-${Date.now()}`,
    });

    // Generar URL de pago de 2Checkout
    const merchantCode = process.env.TWOCHECKOUT_MERCHANT_CODE;
    const publishableKey = process.env.TWOCHECKOUT_PUBLISHABLE_KEY;
    
    if (!merchantCode || !publishableKey) {
      return res.status(500).json({ 
        mensaje: 'Configuración de 2Checkout incompleta',
        detalles: 'Faltan credenciales en el servidor'
      });
    }

    // Crear URL de pago directo de 2Checkout
    const paymentUrl = `https://secure.2checkout.com/order/checkout.php?` +
      `merchant=${merchantCode}&` +
      `product_id=${recarga.numeroReferencia}&` +
      `name=Recarga+de+saldo&` +
      `price=${monto}&` +
      `qty=1&` +
      `currency=USD&` +
      `return_url=${encodeURIComponent(process.env.FRONTEND_URL + '/recargas?success=true')}&` +
      `customer_email=${encodeURIComponent(user.email)}&` +
      `customer_name=${encodeURIComponent(user.nombre || 'Usuario')}`;

    console.log('✅ URL de pago 2Checkout generada:', paymentUrl.substring(0, 100) + '...');

    res.json({
      mensaje: 'URL de pago generada',
      paymentUrl: paymentUrl,
      recargaId: recarga.id,
      monto: recarga.monto,
      numeroReferencia: recarga.numeroReferencia,
    });
  } catch (err) {
    console.error('❌ Error en crearRecargaTwoCheckout:', err);
    return res.status(400).json({ mensaje: 'Error procesando pago 2Checkout', error: err.message });
  }
};

// Webhook de Rapyd para confirmación de pagos
const webhookRapyd = async (req, res) => {
  try {
    console.log('📨 Webhook Rapyd recibido:', req.body);

    // Verificar firma del webhook (importante para seguridad)
    const signature = req.headers['signature'];
    const salt = req.headers['salt'];
    const timestamp = req.headers['timestamp'];

    // Obtener datos del webhook
    const { type, data } = req.body;

    // Responder inmediatamente a Rapyd
    res.status(200).send('Webhook recibido');

    // Procesar webhook según el tipo
    if (type === 'PAYMENT_COMPLETED' || type === 'CHECKOUT_COMPLETED') {
      const checkoutId = data.id;
      const status = data.status;
      const amount = data.amount;

      console.log(`✅ Pago completado - Checkout ID: ${checkoutId}, Estado: ${status}, Monto: ${amount}`);

      // Buscar la recarga asociada
      const recarga = await Recarga.findOne({ where: { rapydCheckoutId: checkoutId } });

      if (recarga && recarga.estado === 'pendiente') {
        // Actualizar estado de la recarga
        recarga.estado = 'exitosa';
        recarga.fechaProcesamiento = new Date();
        await recarga.save();

        // Actualizar saldo del usuario
        const usuario = await User.findByPk(recarga.usuarioId);
        if (usuario) {
          usuario.saldo = parseFloat(usuario.saldo) + parseFloat(recarga.montoNeto);
          await usuario.save();
          console.log(`💰 Saldo actualizado para usuario ${usuario.id}: ${usuario.saldo}`);
        }
      }
    } else if (type === 'PAYMENT_FAILED' || type === 'CHECKOUT_PAYMENT_FAILURE') {
      const checkoutId = data.id;
      console.log(`❌ Pago fallido - Checkout ID: ${checkoutId}`);

      // Marcar recarga como fallida
      const recarga = await Recarga.findOne({ where: { rapydCheckoutId: checkoutId } });
      if (recarga && recarga.estado === 'pendiente') {
        recarga.estado = 'fallida';
        recarga.mensajeError = data.failure_reason || 'Pago rechazado';
        await recarga.save();
      }
    }
  } catch (error) {
    console.error('❌ Error procesando webhook Rapyd:', error);
    // No enviar error al webhook, ya respondimos 200
  }
};

module.exports = {
  crearRecargaStripe,
  crearRecargaRapyd,
  procesarRecargaTarjeta,
  procesarRecargaExitosa,
  obtenerRecargas,
  canjearcoCodigo,
  generarCodigos,
  crearRecargaTwoCheckout,
  webhookRapyd,
};
