// Controlador del Panel de Administración
const { Loan, User, BankAccount, CuotaPrestamo } = require('../models');
const FAQFeedback = require('../models/FAQFeedback');
const { Op } = require('sequelize');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// Forzar que las relaciones se inicialicen
require('../models');

// Dashboard: Estadísticas generales
exports.obtenerDashboard = async (req, res) => {
  try {
    // Contar usuarios
    const totalUsuarios = await User.count();
    
    // Contar préstamos
    const totalPrestamos = await Loan.count();
    const prestamosActivos = await Loan.count({ where: { estado: 'aprobado' } });
    const prestamosPendientes = await Loan.count({ where: { estado: 'pendiente' } });
    
    // Total dinero prestado
    const prestamos = await Loan.findAll({ where: { estado: 'aprobado' } });
    const totalPrestado = prestamos.reduce((sum, p) => sum + parseFloat(p.monto), 0);
    
    // Cuotas pendientes
    const cuotasPendientes = await CuotaPrestamo.count({ where: { pagado: false } });
    const cuotasPagadas = await CuotaPrestamo.count({ where: { pagado: true } });
    
    // Feedback FAQ
    const totalFeedback = await FAQFeedback.count();
    const feedbackUtil = await FAQFeedback.count({ where: { util: true } });
    
    res.json({
      exito: true,
      dashboard: {
        usuarios: {
          total: totalUsuarios,
          nuevosHoy: 0 // TODO: implementar
        },
        prestamos: {
          total: totalPrestamos,
          activos: prestamosActivos,
          pendientes: prestamosPendientes,
          totalPrestado: `$${totalPrestado.toFixed(2)}`
        },
        cuotas: {
          pendientes: cuotasPendientes,
          pagadas: cuotasPagadas,
          porcentajePago: totalPrestamos > 0 ? ((cuotasPagadas / (cuotasPagadas + cuotasPendientes)) * 100).toFixed(1) : 0
        },
        faq: {
          totalFeedback,
          feedbackPositivo: feedbackUtil,
          satisfaccion: totalFeedback > 0 ? ((feedbackUtil / totalFeedback) * 100).toFixed(1) : 0
        }
      }
    });
  } catch (error) {
    console.error('❌ Error en dashboard:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener dashboard',
      error: error.message
    });
  }
};

// Listar usuarios básicos (admin)
exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await User.findAll({
      attributes: ['id', 'nombre', 'apellido', 'email'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      exito: true,
      total: usuarios.length,
      usuarios
    });
  } catch (error) {
    console.error('❌ Error listando usuarios:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al listar usuarios',
      error: error.message
    });
  }
};

// Listar todos los préstamos con información del cliente
exports.listarPrestamos = async (req, res) => {
  try {
    // Obtener todos los préstamos
    const prestamos = await Loan.findAll({
      order: [['createdAt', 'DESC']]
    });

    // Obtener usuarios por separado y agregar manualmente
    const prestamosConInfo = await Promise.all(
      prestamos.map(async (prestamo) => {
        // Obtener usuario
        const usuario = await User.findByPk(prestamo.usuarioId, {
          attributes: ['id', 'nombre', 'apellido', 'email']
        });

        // Obtener cuotas
        const cuotas = await CuotaPrestamo.findAll({
          where: { prestamoId: prestamo.id },
          order: [['numeroCuota', 'ASC']]
        });

        const totalCuotas = cuotas.length;
        const cuotasPagadas = cuotas.filter(c => c.pagado).length;
        const progreso = totalCuotas > 0 ? ((cuotasPagadas / totalCuotas) * 100).toFixed(1) : 0;

        return {
          ...prestamo.toJSON(),
          User: usuario ? usuario.toJSON() : null,
          cuotas: cuotas.map(c => ({
            id: c.id,
            numero: c.numeroCuota,
            monto: c.montoCuota,
            pagado: c.pagado,
            fechaVencimiento: c.fechaVencimiento,
            fechaPago: c.fechaPago
          })),
          totalCuotas,
          cuotasPagadas,
          cuotasPendientes: totalCuotas - cuotasPagadas,
          progreso: `${progreso}%`,
          progresoNumero: parseFloat(progreso)
        };
      })
    );

    res.json({
      exito: true,
      total: prestamosConInfo.length,
      prestamos: prestamosConInfo
    });
  } catch (error) {
    console.error('❌ Error listando préstamos:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al listar préstamos',
      error: error.message
    });
  }
};

// Crear préstamo desde admin (con cuotas)
exports.crearPrestamoAdmin = async (req, res) => {
  try {
    const { usuarioEmail, usuarioId, monto, plazo, tasaInteres, fechaPrimerVencimiento } = req.body;

    if ((!usuarioEmail && !usuarioId) || !monto || !plazo) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Faltan datos obligatorios (usuario, monto, plazo)'
      });
    }

    const montoNumero = parseFloat(monto);
    const plazoNumero = parseInt(plazo, 10);
    const tasaNumero = tasaInteres !== undefined && tasaInteres !== null && tasaInteres !== ''
      ? parseFloat(tasaInteres)
      : 5;

    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      return res.status(400).json({ exito: false, mensaje: 'Monto inválido' });
    }

    if (!Number.isFinite(plazoNumero) || plazoNumero <= 0) {
      return res.status(400).json({ exito: false, mensaje: 'Plazo inválido' });
    }

    const usuario = usuarioId
      ? await User.findByPk(usuarioId)
      : await User.findOne({ where: { email: usuarioEmail } });

    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
    }

    const prestamo = await Loan.create({
      usuarioId: usuario.id,
      montoSolicitado: montoNumero,
      montoAprobado: montoNumero,
      tasaInteres: tasaNumero,
      plazo: plazoNumero,
      estado: 'aprobado',
      bancoDespositante: process.env.BANCO_NOMBRE,
      cuentaBancaria: process.env.BANCO_CUENTA,
      emailAprobacion: process.env.ADMIN_EMAIL,
      fechaAprobacion: new Date(),
      numeroReferencia: `PREST-ADMIN-${Date.now().toString().slice(-8)}`
    });

    const tasaMensual = tasaNumero > 0 ? (tasaNumero / 12 / 100) : 0;
    let cuotaMensual = 0;
    if (tasaMensual > 0) {
      cuotaMensual = (montoNumero * tasaMensual * Math.pow(1 + tasaMensual, plazoNumero)) /
        (Math.pow(1 + tasaMensual, plazoNumero) - 1);
    } else {
      cuotaMensual = montoNumero / plazoNumero;
    }
    cuotaMensual = Math.round(cuotaMensual * 100) / 100;

    const cuotas = [];
    const fechaBase = fechaPrimerVencimiento ? new Date(fechaPrimerVencimiento) : new Date();

    for (let i = 1; i <= plazoNumero; i++) {
      const fechaVencimiento = new Date(fechaBase);
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + (fechaPrimerVencimiento ? (i - 1) : i));

      const cuota = await CuotaPrestamo.create({
        prestamoId: prestamo.id,
        numeroCuota: i,
        montoCuota: cuotaMensual,
        pagado: false,
        fechaVencimiento
      });

      cuotas.push(cuota);
    }

    usuario.saldo = parseFloat(usuario.saldo || 0) + montoNumero;
    await usuario.save();

    res.json({
      exito: true,
      mensaje: '✅ Préstamo creado con cuotas',
      prestamo: prestamo.toJSON(),
      cuotas: cuotas.map(c => c.toJSON())
    });
  } catch (error) {
    console.error('❌ Error creando préstamo admin:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear préstamo',
      error: error.message
    });
  }
};

// Obtener detalles de un préstamo específico
exports.obtenerPrestamo = async (req, res) => {
  try {
    const { id } = req.params;

    const prestamo = await Loan.findByPk(id);

    if (!prestamo) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Préstamo no encontrado'
      });
    }

    // Obtener usuario manualmente
    const usuario = await User.findByPk(prestamo.usuarioId, {
      attributes: ['id', 'nombre', 'apellido', 'email', 'telefono']
    });

    const cuotas = await CuotaPrestamo.findAll({
      where: { prestamoId: id },
      order: [['numeroCuota', 'ASC']]
    });

    res.json({
      exito: true,
      prestamo: {
        ...prestamo.toJSON(),
        User: usuario ? usuario.toJSON() : null,
        cuotas
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo préstamo:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener préstamo',
      error: error.message
    });
  }
};

// Registrar pago de una cuota
exports.registrarPagoCuota = async (req, res) => {
  try {
    const { cuotaId } = req.params;
    const { metodoPago, referenciaPago, notas } = req.body;

    const cuota = await CuotaPrestamo.findByPk(cuotaId);

    if (!cuota) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Cuota no encontrada'
      });
    }

    if (cuota.pagado) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Esta cuota ya está pagada'
      });
    }

    // Actualizar cuota
    cuota.pagado = true;
    cuota.fechaPago = new Date();
    cuota.metodoPago = metodoPago || 'Efectivo';
    cuota.referenciaPago = referenciaPago || null;
    cuota.notas = notas || null;
    await cuota.save();

    // Verificar si todas las cuotas están pagadas
    const todasCuotas = await CuotaPrestamo.findAll({
      where: { prestamoId: cuota.prestamoId }
    });

    const todasPagadas = todasCuotas.every(c => c.pagado);

    if (todasPagadas) {
      // Actualizar estado del préstamo a "pagado"
      const prestamo = await Loan.findByPk(cuota.prestamoId);
      if (prestamo) {
        prestamo.estado = 'pagado';
        await prestamo.save();
      }
    }

    res.json({
      exito: true,
      mensaje: '✅ Pago registrado exitosamente',
      cuota,
      prestamoCompletado: todasPagadas
    });
  } catch (error) {
    console.error('❌ Error registrando pago:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al registrar pago',
      error: error.message
    });
  }
};

// Generar datos para recibo de pago
exports.obtenerReciboPago = async (req, res) => {
  try {
    const { cuotaId } = req.params;

    const cuota = await CuotaPrestamo.findByPk(cuotaId);

    if (!cuota) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Cuota no encontrada'
      });
    }

    if (!cuota.pagado) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Esta cuota no ha sido pagada aún'
      });
    }

    const prestamo = await Loan.findByPk(cuota.prestamoId, {
      include: [{
        model: User,
        attributes: ['id', 'nombre', 'apellido', 'email']
      }]
    });

    const recibo = {
      numeroRecibo: `REC-${cuota.id}-${Date.now()}`,
      fecha: cuota.fechaPago,
      cliente: {
        nombre: `${prestamo.User.nombre} ${prestamo.User.apellido || ''}`.trim(),
        correo: prestamo.User.email
      },
      prestamo: {
        id: prestamo.id,
        monto: prestamo.monto,
        plazo: prestamo.plazo
      },
      cuota: {
        numero: cuota.numeroCuota,
        monto: cuota.montoCuota,
        metodoPago: cuota.metodoPago,
        referencia: cuota.referenciaPago
      }
    };

    res.json({
      exito: true,
      recibo
    });
  } catch (error) {
    console.error('❌ Error generando recibo:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al generar recibo',
      error: error.message
    });
  }
};

// Crear cuotas para un préstamo
exports.crearCuotasPrestamo = async (req, res) => {
  try {
    const { prestamoId } = req.params;
    const { numeroCuotas, montoPorCuota } = req.body;

    const prestamo = await Loan.findByPk(prestamoId);

    if (!prestamo) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Préstamo no encontrado'
      });
    }

    // Eliminar cuotas existentes
    await CuotaPrestamo.destroy({ where: { prestamoId } });

    // Crear nuevas cuotas
    const cuotas = [];
    const fechaInicio = new Date();

    for (let i = 1; i <= numeroCuotas; i++) {
      const fechaVencimiento = new Date(fechaInicio);
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);

      const cuota = await CuotaPrestamo.create({
        prestamoId,
        numeroCuota: i,
        montoCuota: montoPorCuota,
        pagado: false,
        fechaVencimiento
      });

      cuotas.push(cuota);
    }

    res.json({
      exito: true,
      mensaje: `✅ ${cuotas.length} cuotas creadas`,
      cuotas
    });
  } catch (error) {
    console.error('❌ Error creando cuotas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear cuotas',
      error: error.message
    });
  }
};

// 📧 Enviar emails de verificación masiva
exports.enviarVerificacionMasiva = async (req, res) => {
  try {
    console.log('🚀 Iniciando envío de emails de verificación masiva...');
    
    // Obtener todos los usuarios no verificados
    const usuariosNoVerificados = await User.findAll({
      where: { emailVerificado: false },
      raw: true
    });

    console.log(`📨 Encontrados ${usuariosNoVerificados.length} usuarios para verificar`);

    if (usuariosNoVerificados.length === 0) {
      return res.json({
        exito: true,
        mensaje: 'No hay usuarios para verificar',
        emailsEnviados: 0,
        errores: 0
      });
    }

    let enviados = 0;
    let errores = 0;
    const reporteDetallado = [];

    for (const usuario of usuariosNoVerificados) {
      try {
        // Generar token de verificación
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // Actualizar usuario con el token
        await User.update(
          {
            emailVerificationToken: token,
            emailVerificationExpires: expiresAt
          },
          { where: { id: usuario.id } }
        );

        // Enviar email
        const resultado = await emailService.enviarVerificacionEmail(usuario, token);

        if (resultado && resultado.enviado === false) {
          throw new Error(resultado.motivo || 'Email no enviado');
        }

        enviados++;
        reporteDetallado.push({
          email: usuario.email,
          estado: '✅ Enviado'
        });

        console.log(`✅ Email enviado a: ${usuario.email}`);
      } catch (error) {
        errores++;
        reporteDetallado.push({
          email: usuario.email,
          estado: `❌ Error: ${error.message}`
        });

        console.error(`❌ Error enviando a ${usuario.email}:`, error.message);
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`✅ Enviados: ${enviados}`);
    console.log(`❌ Errores: ${errores}`);

    res.json({
      exito: true,
      mensaje: `Verificación masiva completada`,
      emailsEnviados: enviados,
      errores: errores,
      total: usuariosNoVerificados.length,
      reporte: reporteDetallado
    });
  } catch (error) {
    console.error('❌ Error en verificación masiva:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al enviar emails de verificación',
      error: error.message
    });
  }
};

// 🧪 Probar configuración de Email
exports.probarSMTP = async (req, res) => {
  try {
    const { emailDestino } = req.body;
    
    if (!emailDestino) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debes proporcionar un email de destino'
      });
    }

    console.log(`\n🧪 ========== PROBANDO EMAIL SERVICE ==========`);
    console.log(`Destino: ${emailDestino}`);
    console.log(`SENDGRID_API_KEY en proceso.env: ${process.env.SENDGRID_API_KEY ? '✅ EXISTS' : '❌ NOT EXISTS'}`);
    console.log(`SENDGRID_API_KEY length: ${process.env.SENDGRID_API_KEY?.length || 0}`);
    console.log(`SENDGRID_FROM: ${process.env.SENDGRID_FROM}`);

    // Crear usuario de prueba
    const usuarioPrueba = {
      id: 999,
      nombre: 'Usuario Prueba',
      email: emailDestino
    };

    const token = 'test-token-123456';
    const resultado = await emailService.enviarVerificacionEmail(usuarioPrueba, token);

    console.log(`\n📊 Resultado del envío:`);
    console.log(JSON.stringify(resultado, null, 2));
    console.log(`🧪 ========== FIN TEST ==========\n`);

    res.json({
      exito: true,
      mensaje: 'Email de prueba enviado',
      resultado: resultado,
      config: {
        sendgridApiKey: process.env.SENDGRID_API_KEY ? '✅ SET' : '❌ NOT SET',
        sendgridFrom: process.env.SENDGRID_FROM,
        smtpHost: process.env.SMTP_HOST || '❌ NOT SET',
        resendApiKey: process.env.RESEND_API_KEY ? '✅ SET' : '❌ NOT SET'
      }
    });
  } catch (error) {
    console.error('❌ Error probando Email Service:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al probar Email Service',
      error: error.message,
      stack: error.stack
    });
  }
};

// 🧪 Probar configuración de 2Checkout
exports.probar2Checkout = async (req, res) => {
  try {
    console.log(`\n🧪 ========== PROBANDO 2CHECKOUT ==========`);
    
    const config = {
      merchantCode: process.env.TWOCHECKOUT_MERCHANT_CODE,
      privateKey: process.env.TWOCHECKOUT_PRIVATE_KEY,
      secretKey: process.env.TWOCHECKOUT_SECRET_KEY,
      publishableKey: process.env.TWOCHECKOUT_PUBLISHABLE_KEY,
    };

    console.log(`Merchant Code: ${config.merchantCode ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`Private Key: ${config.privateKey ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`Secret Key: ${config.secretKey ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`Publishable Key: ${config.publishableKey ? '✅ SET' : '❌ NOT SET'}`);

    // Verificar que todos los datos estén presentes
    if (!config.merchantCode || !config.privateKey || !config.secretKey || !config.publishableKey) {
      console.log(`❌ Faltan credenciales de 2Checkout`);
      return res.json({
        exito: false,
        mensaje: '❌ 2Checkout no está completamente configurado',
        config: {
          merchantCode: config.merchantCode ? '✅ SET' : '❌ NOT SET',
          privateKey: config.privateKey ? '✅ SET' : '❌ NOT SET',
          secretKey: config.secretKey ? '✅ SET' : '❌ NOT SET',
          publishableKey: config.publishableKey ? '✅ SET' : '❌ NOT SET',
        }
      });
    }

    // Intentar autenticación básica (simular)
    const auth = Buffer.from(`${config.merchantCode}:${config.privateKey}`).toString('base64');
    console.log(`✅ Base64 Auth: ${auth.substring(0, 20)}...`);

    console.log(`✅ 2Checkout configurado correctamente`);
    console.log(`🧪 ========== FIN TEST ==========\n`);

    res.json({
      exito: true,
      mensaje: '✅ 2Checkout configurado correctamente',
      config: {
        merchantCode: config.merchantCode ? '✅ SET' : '❌ NOT SET',
        privateKey: config.privateKey ? '✅ SET' : '❌ NOT SET',
        secretKey: config.secretKey ? '✅ SET' : '❌ NOT SET',
        publishableKey: config.publishableKey ? '✅ SET' : '❌ NOT SET',
        authReady: true
      }
    });
  } catch (error) {
    console.error('❌ Error probando 2Checkout:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al probar 2Checkout',
      error: error.message
    });
  }
};
