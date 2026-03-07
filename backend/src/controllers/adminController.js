// Controlador del Panel de Administración
const { Loan, User, BankAccount, CuotaPrestamo, Inversion } = require('../models');
const Transfer = require('../models/Transfer');
const TransferenciaBancaria = require('../models/TransferenciaBancaria');
const TransferenciaInternacional = require('../models/TransferenciaInternacional');
const Recarga = require('../models/Recarga');
const SolicitudRetiroManual = require('../models/SolicitudRetiroManual');
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

// Estado de cuenta: todas las transacciones de un usuario
exports.obtenerEstadoCuentaUsuario = async (req, res) => {
  const usuarioId = req.params.id;
  try {
    // Buscar todas las transacciones relacionadas al usuario
    const [recargas, retiros, transferenciasBancarias, transferenciasInternacionales, prestamos, inversiones, transferencias] = await Promise.all([
      Recarga.findAll({ where: { usuarioId }, order: [['createdAt', 'DESC']] }),
      SolicitudRetiroManual.findAll({ where: { usuarioId }, order: [['createdAt', 'DESC']] }),
      TransferenciaBancaria.findAll({ where: { usuarioId }, order: [['createdAt', 'DESC']] }),
      TransferenciaInternacional.findAll({ where: { usuarioId }, order: [['createdAt', 'DESC']] }),
      Loan.findAll({ where: { usuarioId }, order: [['createdAt', 'DESC']] }),
      Inversion ? Inversion.findAll({ where: { usuarioId }, order: [['createdAt', 'DESC']] }) : [],
      Transfer.findAll({
        where: {
          [Op.or]: [{ remitenteId: usuarioId }, { destinatarioId: usuarioId }]
        },
        order: [['createdAt', 'DESC']]
      })
    ]);

    res.json({
      exito: true,
      recargas,
      retiros,
      transferenciasBancarias,
      transferenciasInternacionales,
      prestamos,
      inversiones,
      transferencias
    });
  } catch (error) {
    console.error('❌ Error obteniendo estado de cuenta:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener estado de cuenta',
      error: error.message
    });
  }
};
    


// Listar usuarios básicos (admin)
exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await User.findAll({
      attributes: [
        'id',
        'nombre',
        'apellido',
        'email',
        'cedula',
        'telefono',
        'direccion',
        'saldo',
        'emailVerificado',
        'rol'
      ],
      order: [['createdAt', 'DESC']]
    });

    // Para cada usuario, buscar el préstamo activo (aprobado) más reciente y exponer montoAprobado como saldoNegativo
    const usuariosConNegativo = await Promise.all(usuarios.map(async (u) => {
      const prestamoActivo = await Loan.findOne({
        where: { usuarioId: u.id, estado: 'aprobado' },
        order: [['createdAt', 'DESC']]
      });
      let saldoNegativo = '';
      let capitalPrestamo = '';
      if (prestamoActivo) {
        const capital = parseFloat(prestamoActivo.montoAprobado);
        const interes = parseFloat(prestamoActivo.interes || 0);
        saldoNegativo = capital + interes;
        capitalPrestamo = capital;
      }
      return {
        ...u.toJSON(),
        saldoNegativo,
        capitalPrestamo
      };
    }));

    res.json({
      exito: true,
      total: usuariosConNegativo.length,
      usuarios: usuariosConNegativo
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

// Crear usuario desde admin (requiere verificación por email)
exports.crearUsuarioAdmin = async (req, res) => {
  try {
    const { nombre, apellido, email, password, cedula, telefono, direccion } = req.body;

    if (!nombre || !apellido || !email || !password || !cedula || !telefono || !direccion) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Todos los campos son requeridos'
      });
    }

    const emailNormalizado = email.toLowerCase().trim();

    const usuarioExistente = await User.findOne({ where: { email: emailNormalizado } });
    if (usuarioExistente) {
      return res.status(400).json({ exito: false, mensaje: 'El email ya está registrado' });
    }

    const cedulaExistente = await User.findOne({ where: { cedula } });
    if (cedulaExistente) {
      return res.status(400).json({ exito: false, mensaje: 'La cédula ya está registrada' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const nuevoUsuario = await User.create({
      nombre,
      apellido,
      email: emailNormalizado,
      password,
      cedula,
      telefono,
      direccion,
      saldo: 0,
      rol: 'cliente',
      emailVerificado: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await emailService.enviarVerificacionEmail(nuevoUsuario, verificationToken);

    res.status(201).json({
      exito: true,
      mensaje: '✅ Usuario creado. Debe verificar su correo para iniciar sesión.',
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        apellido: nuevoUsuario.apellido,
        email: nuevoUsuario.email,
        emailVerificado: nuevoUsuario.emailVerificado
      }
    });
  } catch (error) {
    console.error('❌ Error creando usuario admin:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear usuario',
      error: error.message
    });
  }
};

// Actualizar usuario desde admin
exports.actualizarUsuarioAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, cedula, telefono, direccion, saldo, saldoNegativo, emailVerificado } = req.body;

    const usuario = await User.findByPk(id);
    if (!usuario) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    // Verificar email duplicado si se cambió
    if (email && email !== usuario.email) {
      const emailNormalizado = email.toLowerCase().trim();
      const emailExistente = await User.findOne({ 
        where: { 
          email: emailNormalizado,
          id: { [require('sequelize').Op.ne]: id }
        } 
      });
      if (emailExistente) {
        return res.status(400).json({ exito: false, mensaje: 'El email ya está registrado' });
      }
      usuario.email = emailNormalizado;
    }

    // Verificar cédula duplicada si se cambió
    if (cedula && cedula !== usuario.cedula) {
      const cedulaExistente = await User.findOne({ 
        where: { 
          cedula,
          id: { [require('sequelize').Op.ne]: id }
        } 
      });
      if (cedulaExistente) {
        return res.status(400).json({ exito: false, mensaje: 'La cédula ya está registrada' });
      }
      usuario.cedula = cedula;
    }

    // Actualizar campos
    if (nombre !== undefined) usuario.nombre = nombre;
    if (apellido !== undefined) usuario.apellido = apellido;
    if (telefono !== undefined) usuario.telefono = telefono;
    if (direccion !== undefined) usuario.direccion = direccion;
    if (saldo !== undefined) usuario.saldo = parseFloat(saldo);
    if (emailVerificado !== undefined) usuario.emailVerificado = emailVerificado;


    await usuario.save();

    // Si se envía saldoNegativo, actualizar el préstamo activo (aprobado) más reciente
    if (saldoNegativo !== undefined && saldoNegativo !== null && saldoNegativo !== '') {
      const prestamoActivo = await Loan.findOne({
        where: { usuarioId: usuario.id, estado: 'aprobado' },
        order: [['createdAt', 'DESC']]
      });
      if (prestamoActivo) {
        prestamoActivo.montoAprobado = parseFloat(saldoNegativo);
        await prestamoActivo.save();
      }
    }

    res.json({
      exito: true,
      mensaje: '✅ Usuario actualizado correctamente',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        cedula: usuario.cedula,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        saldo: usuario.saldo,
        emailVerificado: usuario.emailVerificado
      }
    });
  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

// Eliminar usuario desde admin
exports.eliminarUsuarioAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await User.findByPk(id);
    if (!usuario) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    // Verificar que no sea admin
    if (usuario.rol === 'admin') {
      return res.status(403).json({
        exito: false,
        mensaje: 'No se puede eliminar un usuario administrador'
      });
    }

    // Verificar préstamos activos
    const Loan = require('../models/Loan');
    const prestamosActivos = await Loan.count({
      where: {
        usuarioId: id,
        estado: ['pendiente', 'aprobado']
      }
    });

    if (prestamosActivos > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: `No se puede eliminar. El usuario tiene ${prestamosActivos} préstamo(s) activo(s)`
      });
    }

    await usuario.destroy();

    res.json({
      exito: true,
      mensaje: '✅ Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al eliminar usuario',
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
    const { usuarioEmail, usuarioId, monto, plazo, tasaInteres, fechaPrimerVencimiento, sandbox } = req.body;

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

    const interesFijo = Number(req.body.interes) || 0;
    const prestamo = await Loan.create({
      usuarioId: usuario.id,
      montoSolicitado: montoNumero,
      montoAprobado: montoNumero + interesFijo, // El saldo del préstamo es positivo
      interes: interesFijo,
      plazo: plazoNumero,
      estado: 'aprobado',
      bancoDespositante: process.env.BANCO_NOMBRE,
      cuentaBancaria: process.env.BANCO_CUENTA,
      emailAprobacion: process.env.ADMIN_EMAIL,
      fechaAprobacion: new Date(),
      numeroReferencia: `${sandbox ? 'SANDBOX' : 'PREST-ADMIN'}-${Date.now().toString().slice(-8)}`
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

    if (!sandbox) {
      usuario.saldo = parseFloat(usuario.saldo || 0) + montoNumero;
      await usuario.save();
    }

    res.json({
      exito: true,
      mensaje: '✅ Préstamo creado con cuotas',
      prestamo: prestamo.toJSON(),
      sandbox: !!sandbox,
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

    console.log('🔍 Buscando cuota con ID:', cuotaId);
    console.log('📦 Datos recibidos:', { metodoPago, referenciaPago, notas });

    const cuota = await CuotaPrestamo.findByPk(cuotaId);

    if (!cuota) {
      console.log('❌ Cuota no encontrada');
      return res.status(404).json({
        exito: false,
        mensaje: 'Cuota no encontrada'
      });
    }

    console.log('✅ Cuota encontrada:', cuota.toJSON());

    if (cuota.pagado) {
      // Volver a consultar la cuota por si hay un error de concurrencia
      const cuotaActualizada = await CuotaPrestamo.findByPk(cuotaId);
      if (cuotaActualizada && cuotaActualizada.pagado) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Esta cuota ya está pagada (verificado en tiempo real)'
        });
      }
    }

    // Actualizar cuota
    cuota.pagado = true;
    cuota.fechaPago = new Date();
    cuota.metodoPago = metodoPago || 'Efectivo';
    cuota.referenciaPago = referenciaPago || null;
    cuota.notas = notas || null;
    await cuota.save();

    // Actualizar saldo del préstamo (siempre descuenta la cuota del saldo negativo)
    const prestamo = await Loan.findByPk(cuota.prestamoId);
    if (prestamo) {
      const montoPago = parseFloat(cuota.montoCuota || 0);
      let saldoPrestamo = parseFloat(prestamo.montoAprobado || 0);
      if (saldoPrestamo > 0) {
        let nuevoSaldo = saldoPrestamo - montoPago;
        prestamo.montoAprobado = nuevoSaldo < 0 ? 0 : nuevoSaldo;
      }
      // Si todas las cuotas están pagadas, marcar préstamo como pagado
      const todasCuotas = await CuotaPrestamo.findAll({ where: { prestamoId: cuota.prestamoId } });
      const todasPagadas = todasCuotas.every(c => c.pagado);
      if (todasPagadas) {
        prestamo.estado = 'pagado';
      }
      await prestamo.save();
    }

    // Calcular saldo negativo con tasa de interés si aplica
    let saldoNegativoConTasa = null;
    if (prestamo && prestamo.montoAprobado < 0 && prestamo.tasaInteres) {
      const tasa = parseFloat(prestamo.tasaInteres) / 100;
      saldoNegativoConTasa = prestamo.montoAprobado + (prestamo.montoAprobado * tasa);
    }

    res.json({
      exito: true,
      mensaje: '✅ Pago registrado exitosamente',
      cuota,
      prestamoCompletado: prestamo ? prestamo.estado === 'pagado' : false,
      saldoPrestamoPendiente: prestamo ? prestamo.montoAprobado : null,
      saldoNegativoConTasa
    });
  } catch (error) {
    console.error('❌ Error registrando pago:', error);
    console.error('❌ Stack:', error.stack);
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

// Estado mercantil: consolidado de movimientos
exports.obtenerEstadoMercantil = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const dateFilter = {};
    if (desde || hasta) {
      dateFilter[Op.between] = [
        desde ? new Date(desde) : new Date('2000-01-01'),
        hasta ? new Date(hasta) : new Date(),
      ];
    }

    const recargas = await Recarga.findAll({
      where: {
        ...(dateFilter[Op.between] ? { createdAt: dateFilter } : {}),
        estado: { [Op.in]: ['exitosa', 'reembolsada'] },
      },
      order: [['createdAt', 'DESC']],
    });

    const retiros = await SolicitudRetiroManual.findAll({
      where: dateFilter[Op.between] ? { createdAt: dateFilter } : undefined,
      order: [['createdAt', 'DESC']],
    });

    const transferencias = await Transfer.findAll({
      where: dateFilter[Op.between] ? { createdAt: dateFilter } : undefined,
      order: [['createdAt', 'DESC']],
    });

    const transferenciasBancarias = await TransferenciaBancaria.findAll({
      where: dateFilter[Op.between] ? { createdAt: dateFilter } : undefined,
      order: [['createdAt', 'DESC']],
    });

    const transferenciasInternacionales = await TransferenciaInternacional.findAll({
      where: dateFilter[Op.between] ? { createdAt: dateFilter } : undefined,
      order: [['createdAt', 'DESC']],
    });

    const prestamos = await Loan.findAll({
      where: dateFilter[Op.between] ? { createdAt: dateFilter } : undefined,
      order: [['createdAt', 'DESC']],
    });

    const cuotas = await CuotaPrestamo.findAll({
      where: {
        pagado: true,
        ...(dateFilter[Op.between]
          ? { fechaPago: dateFilter }
          : {}),
      },
      order: [['fechaPago', 'DESC']],
    });

    const prestamoIds = new Set([...prestamos.map((p) => p.id), ...cuotas.map((c) => c.prestamoId)]);
    const prestamosExtra = await Loan.findAll({
      where: { id: { [Op.in]: Array.from(prestamoIds) } },
      order: [['createdAt', 'DESC']],
    });

    const userIds = new Set();
    recargas.forEach((r) => userIds.add(r.usuarioId));
    retiros.forEach((r) => userIds.add(r.usuarioId));
    transferencias.forEach((t) => {
      userIds.add(t.remitenteId);
      userIds.add(t.destinatarioId);
    });
    transferenciasBancarias.forEach((t) => userIds.add(t.usuarioId));
    transferenciasInternacionales.forEach((t) => userIds.add(t.usuarioId));
    prestamosExtra.forEach((p) => userIds.add(p.usuarioId));

    const usuarios = await User.findAll({
      where: { id: { [Op.in]: Array.from(userIds) } },
      attributes: ['id', 'nombre', 'apellido', 'email'],
    });
    const usuariosMap = new Map(usuarios.map((u) => [u.id, u]));

    const prestamosMap = new Map(prestamosExtra.map((p) => [p.id, p]));

    const movimientos = [];

    recargas.forEach((r) => {
      movimientos.push({
        fecha: r.createdAt,
        tipo: 'Recarga',
        usuario: usuariosMap.get(r.usuarioId),
        monto: r.montoNeto,
        moneda: r.metodo === 'paypal' ? 'USD' : 'DOP',
        estado: r.estado,
        referencia: r.numeroReferencia,
        detalle: r.descripcion || r.metodo,
      });
    });

    retiros.forEach((r) => {
      movimientos.push({
        fecha: r.createdAt,
        tipo: 'Retiro manual',
        usuario: usuariosMap.get(r.usuarioId),
        monto: r.monto,
        moneda: r.moneda || 'DOP',
        estado: r.estado,
        referencia: r.numeroReferencia,
        detalle: r.banco || 'Retiro en efectivo',
      });
    });

    transferencias.forEach((t) => {
      const remitente = usuariosMap.get(t.remitenteId);
      const destinatario = usuariosMap.get(t.destinatarioId);
      movimientos.push({
        fecha: t.createdAt,
        tipo: 'Transferencia interna',
        usuario: remitente,
        monto: t.monto,
        moneda: 'DOP',
        estado: t.estado,
        referencia: t.id,
        detalle: `A ${destinatario?.nombre || ''} ${destinatario?.apellido || ''}`.trim(),
      });
    });

    transferenciasBancarias.forEach((t) => {
      movimientos.push({
        fecha: t.createdAt,
        tipo: 'Transferencia bancaria',
        usuario: usuariosMap.get(t.usuarioId),
        monto: t.monto,
        moneda: 'DOP',
        estado: t.estado,
        referencia: t.codigoReferencia,
        detalle: t.banco,
      });
    });

    transferenciasInternacionales.forEach((t) => {
      movimientos.push({
        fecha: t.createdAt,
        tipo: 'Transferencia internacional',
        usuario: usuariosMap.get(t.usuarioId),
        monto: t.monto,
        moneda: t.monedaDestino || 'USD',
        estado: t.estado,
        referencia: t.rapydPayoutId || t.id,
        detalle: `${t.paisDestino} - ${t.nombreBeneficiario}`,
      });
    });

    prestamos.forEach((p) => {
      movimientos.push({
        fecha: p.createdAt,
        tipo: 'Prestamo',
        usuario: usuariosMap.get(p.usuarioId),
        monto: p.montoAprobado || p.montoSolicitado,
        moneda: 'DOP',
        estado: p.estado,
        referencia: p.numeroReferencia,
        detalle: `Plazo ${p.plazo} cuotas`,
      });
    });

    cuotas.forEach((c) => {
      const prestamo = prestamosMap.get(c.prestamoId);
      movimientos.push({
        fecha: c.fechaPago,
        tipo: 'Pago de cuota',
        usuario: prestamo ? usuariosMap.get(prestamo.usuarioId) : null,
        monto: c.montoCuota,
        moneda: 'DOP',
        estado: c.pagado ? 'pagado' : 'pendiente',
        referencia: c.referenciaPago,
        detalle: `Prestamo #${c.prestamoId} cuota ${c.numeroCuota}`,
      });
    });

    movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json({
      exito: true,
      total: movimientos.length,
      movimientos,
    });
  } catch (error) {
    console.error('❌ Error obteniendo estado mercantil:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al generar estado mercantil',
      error: error.message,
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
