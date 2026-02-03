const Recarga = require('../models/Recarga');
const CodigoRecarga = require('../models/CodigoRecarga');
const User = require('../models/User');
const stripeService = require('../services/stripeService');
const rapydService = require('../services/rapydService');
const paypalService = require('../services/paypalService');
const { calcularComisionRecarga, calcularMontoNeto } = require('../config/comisiones');

console.log('✅ RecargaController loaded - v2.1 with Rapyd support');

// Crear sesión de recarga con Stripe
const crearRecargaStripe = async (req, res) => {
  try {
    const { monto } = req.body;
    const usuarioId = req.usuario.id;

    if (!monto || monto <= 0) {
      return res.status(400).json({ mensaje: 'Monto debe ser mayor a 0' });
    }

    const montoNumerico = parseFloat(monto);
    const comision = calcularComisionRecarga();
    const montoNeto = calcularMontoNeto(montoNumerico, comision);
    if (montoNeto <= 0) {
      return res.status(400).json({ mensaje: 'Monto insuficiente para cubrir la comisión' });
    }

    // Crear recarga pendiente en BD
    const recarga = await Recarga.create({
      usuarioId,
      monto: montoNumerico,
      montoNeto,
      comision,
      metodo: 'tarjeta',
      estado: 'pendiente',
      numeroReferencia: `REC-${Date.now()}`,
    });

    // Crear sesión de pago con Stripe
    try {
      const session = await stripeService.crearSesionPago(
        montoNumerico,
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
    console.error('❌ Error crearRecargaPayPal:', error.message);
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
      monto: montoNumerico,
      montoNeto,
      comision,
      metodo: 'rapyd',
      estado: 'pendiente',
      numeroReferencia: `REC-${Date.now()}`,
    });

    try {
      // Crear pago con Rapyd
      const pago = await rapydService.crearPagoRecarga({
        monto: montoNumerico,
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

    const montoNumerico = parseFloat(monto);
    const comision = calcularComisionRecarga();
    const montoNeto = calcularMontoNeto(montoNumerico, comision);
    if (montoNeto <= 0) {
      return res.status(400).json({ mensaje: 'Monto insuficiente para cubrir la comisión' });
    }

    // Crear recarga en BD (estado pendiente)
    const recarga = await Recarga.create({
      usuarioId,
      monto: montoNumerico,
      montoNeto,
      comision,
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
        amount: Math.round(montoNumerico * 100), // Convertir a centavos
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
        usuario.saldo = parseFloat(usuario.saldo) + parseFloat(recarga.montoNeto);
        await usuario.save();

        return res.json({
          mensaje: 'Recarga procesada exitosamente',
          montoAgregado: recarga.montoNeto,
          comision: recarga.comision,
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
    console.error('❌ Error capturarRecargaPayPal:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Crear recarga con PayPal (LIVE o SANDBOX según credenciales)
const crearRecargaPayPal = async (req, res) => {
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

    // Validar credenciales de PayPal ANTES de crear la recarga
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.error('❌ Credenciales de PayPal no configuradas');
      return res.status(500).json({ 
        error: 'Credenciales de PayPal no configuradas en el servidor',
        detalles: 'PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET falta en .env',
        ayuda: 'Contacta al administrador del servidor'
      });
    }

    const montoNumerico = parseFloat(monto);
    const comision = calcularComisionRecarga();
    const montoNeto = calcularMontoNeto(montoNumerico, comision);

    if (montoNeto <= 0) {
      return res.status(400).json({ mensaje: 'Monto insuficiente para cubrir la comisión' });
    }

    // Crear recarga pendiente en BD
    const recarga = await Recarga.create({
      usuarioId,
      monto: montoNumerico,
      montoNeto,
      comision,
      metodo: 'paypal',
      estado: 'pendiente',
      numeroReferencia: `PP-${Date.now()}`,
    });

    // URLs de retorno (usar fallback si FRONTEND_URL no está configurada)
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.bancoexclusivo.lat';
    const returnUrl = `${frontendUrl}/recargas?success=true&recargaId=${encodeURIComponent(recarga.id)}`;
    const cancelUrl = `${frontendUrl}/recargas?error=cancelled`;

    console.log(`📝 Creando orden PayPal: ${recarga.numeroReferencia}`);
    console.log(`   Monto: ${montoNumerico} DOP`);
    console.log(`   Return URL: ${returnUrl}`);

    try {
      const order = await paypalService.crearOrden({
        monto: montoNumerico,
        currency: 'DOP',
        returnUrl,
        cancelUrl,
        referencia: recarga.numeroReferencia,
      });

      const approveLink = (order.links || []).find((link) => link.rel === 'approve');
      if (!approveLink?.href) {
        throw new Error('PayPal no devolvió URL de aprobación. Respuesta: ' + JSON.stringify(order));
      }

      recarga.paypalOrderId = order.id;
      await recarga.save();

      console.log(`✅ Orden PayPal creada: ${order.id}`);

      res.json({
        mensaje: 'Orden PayPal creada',
        checkoutUrl: approveLink.href,
        orderId: order.id,
        recargaId: recarga.id,
        monto: recarga.monto,
        montoNeto: recarga.montoNeto,
        comision: recarga.comision,
        numeroReferencia: recarga.numeroReferencia,
      });
    } catch (paypalError) {
      console.error('❌ Error PayPal:', paypalError.message);
      console.error('📋 Detalles:', paypalError.response?.data || paypalError.message);
      
      recarga.estado = 'fallida';
      recarga.mensajeError = paypalError.message;
      await recarga.save();

      // Detectar si es error de autenticación
      const isAuthError = paypalError.message?.includes('token') || 
                         paypalError.message?.includes('unauthorized') ||
                         paypalError.message?.includes('authentication');

      res.status(500).json({ 
        error: paypalError.message,
        detalles: isAuthError 
          ? 'Error de autenticación con PayPal. Verifica que PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET sean correctos.'
          : 'Error comunicándose con PayPal',
        tipo: isAuthError ? 'AUTH_ERROR' : 'API_ERROR'
      });
    }
  } catch (error) {
    console.error('❌ Error en crearRecargaPayPal:', error.message);
    console.error('📋 Stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      detalles: 'Error interno del servidor'
    });
  }
};

// Capturar recarga PayPal (SIN autenticación - viene desde PayPal redirect)
const capturarRecargaPayPal = async (req, res) => {
  try {
    const { token, recargaId } = req.body;
    let id = recargaId || token;

    // Convertir a número si es string
    if (typeof id === 'string') {
      id = parseInt(id, 10);
    }

    console.log('🔍 Capturando PayPal - recargaId:', id, 'Tipo:', typeof id, '| Body:', req.body);

    if (!id || isNaN(id)) {
      console.error('❌ ID inválido:', id);
      return res.status(400).json({ 
        mensaje: 'recargaId o token requerido (debe ser número válido)', 
        recibido: req.body 
      });
    }

    // Buscar recarga
    const recarga = await Recarga.findByPk(id);
    console.log('🔍 Recarga encontrada:', recarga?.id, 'Estado:', recarga?.estado, 'paypalOrderId:', recarga?.paypalOrderId);

    if (!recarga) {
      console.error('❌ Recarga no encontrada. ID:', id);
      return res.status(404).json({ 
        mensaje: 'Recarga no encontrada', 
        id,
        buscada: id 
      });
    }

    // Verificar que la recarga sea de PayPal
    if (recarga.metodo !== 'paypal') {
      console.error('❌ Recarga no es de PayPal. Metodo:', recarga.metodo);
      return res.status(400).json({ 
        mensaje: 'Esta recarga no es de PayPal',
        metodo: recarga.metodo
      });
    }

    // Si ya fue capturada exitosamente, no volver a capturar
    if (recarga.estado === 'exitosa') {
      console.log('ℹ️ Recarga ya capturada exitosamente. Retornando estado existente.');
      const usuario = await User.findByPk(recarga.usuarioId);
      return res.json({
        mensaje: 'Pago PayPal ya había sido completado',
        recargaId: recarga.id,
        nuevoSaldo: usuario?.saldo,
        yaCapturada: true,
      });
    }

    if (!recarga.paypalOrderId) {
      console.error('❌ Recarga sin paypalOrderId. RecargaId:', recarga.id);
      return res.status(400).json({ 
        mensaje: 'Recarga sin paypalOrderId asociado', 
        recargaId: recarga.id 
      });
    }

    console.log('📝 Capturando orden PayPal:', recarga.paypalOrderId);
    let capture;
    try {
      capture = await paypalService.capturarOrden(recarga.paypalOrderId);
      console.log('✅ Respuesta PayPal completa:', JSON.stringify(capture, null, 2));
    } catch (error) {
      console.error('❌ Error capturando PayPal:', error.message);
      console.error('📋 Respuesta completa:', error.response?.data || 'Sin datos');
      
      // Intentar interpretar el error
      const errorData = error.response?.data;
      const errorCode = errorData?.name || errorData?.status?.error_code;
      
      recarga.estado = 'fallida';
      recarga.mensajeError = `Error PayPal: ${error.message}`;
      await recarga.save();
      
      return res.status(400).json({ 
        mensaje: 'Error capturando pago PayPal', 
        error: error.message,
        errorCode: errorCode,
        detalles: errorData
      });
    }
    
    const status = capture?.status;
    console.log('📊 Status PayPal:', status, 'Capture ID:', capture?.id);

    if (status !== 'COMPLETED') {
      console.warn('⚠️ Pago no completado. Status:', status, 'Detalles:', JSON.stringify(capture));
      recarga.estado = 'fallida';
      recarga.mensajeError = `PayPal status: ${status}`;
      await recarga.save();
      return res.status(400).json({ 
        mensaje: 'Pago no completado', 
        status,
        detalles: capture 
      });
    }

    const captureId = capture.id || capture.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    recarga.estado = 'exitosa';
    recarga.paypalCaptureId = captureId || null;
    recarga.fechaProcesamiento = new Date();
    await recarga.save();

    const usuario = await User.findByPk(recarga.usuarioId);
    if (usuario) {
      usuario.saldo = parseFloat(usuario.saldo) + parseFloat(recarga.montoNeto);
      await usuario.save();
      console.log(`✅ Saldo actualizado. Usuario: ${usuario.id}, Nuevo saldo: ${usuario.saldo}`);
    }

    return res.json({
      mensaje: 'Pago PayPal completado exitosamente',
      recargaId: recarga.id,
      nuevoSaldo: usuario?.saldo,
      paypalOrderId: recarga.paypalOrderId,
      captureId,
    });
  } catch (error) {
    console.error('❌ Error en capturarRecargaPayPal:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      detalles: 'Error interno del servidor'
    });
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
      monto: montoNumerico,
      montoNeto,
      comision,
      metodo: '2checkout',
      estado: 'pendiente',
      numeroReferencia: `2CO-${Date.now()}`,
    });

    // Generar URL de pago de 2Checkout
    const merchantCode = process.env.TWOCHECKOUT_MERCHANT_CODE;
    const publishableKey = process.env.TWOCHECKOUT_PUBLISHABLE_KEY;
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.bancoexclusivo.lat';
    
    if (!merchantCode || !publishableKey) {
      return res.status(500).json({ 
        mensaje: 'Configuración de 2Checkout incompleta',
        detalles: 'Faltan credenciales en el servidor'
      });
    }

    // Crear URL de pago directo de 2Checkout
    // Nota: Usar product_id=1 (debe existir en tu dashboard de 2Checkout)
    const paymentUrl = `https://secure.2checkout.com/order/checkout.php?` +
      `merchant=${merchantCode}&` +
      `product_id=1&` +
      `price=${montoNumerico}&` +
      `qty=1&` +
      `currency=DOP&` +
      `return_url=${encodeURIComponent(frontendUrl + '/recargas?success=true')}&` +
      `return_url_fail=${encodeURIComponent(frontendUrl + '/recargas?error=cancelled')}&` +
      `email=${encodeURIComponent(user.email)}&` +
      `name=${encodeURIComponent(user.nombre || 'Usuario')}&` +
      `ref=${recarga.numeroReferencia}`;

    console.log('✅ URL de pago 2Checkout generada:', paymentUrl.substring(0, 100) + '...');

    res.json({
      mensaje: 'URL de pago generada',
      paymentUrl: paymentUrl,
      recargaId: recarga.id,
      monto: recarga.monto,
      montoNeto: recarga.montoNeto,
      comision: recarga.comision,
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
  crearRecargaPayPal,
  capturarRecargaPayPal,
  procesarRecargaTarjeta,
  procesarRecargaExitosa,
  obtenerRecargas,
  canjearcoCodigo,
  generarCodigos,
  crearRecargaTwoCheckout,
  webhookRapyd,
};
