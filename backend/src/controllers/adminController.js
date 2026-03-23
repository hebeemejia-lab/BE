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

const formatearFechaCorta = (valor) => {
  if (!valor) {
    return null;
  }

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    return null;
  }

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const toNumberOrZero = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const redondearDinero = (value) => parseFloat(toNumberOrZero(value).toFixed(2));

const calcularSaldoPrestamoPendiente = (prestamo, cuotas = []) => {
  const estado = String(prestamo?.estado || '').toLowerCase();
  if (estado === 'completado' || estado === 'rechazado' || estado === 'pagado' || estado === 'cerrado') {
    return 0;
  }

  if (Array.isArray(cuotas) && cuotas.length > 0) {
    return redondearDinero(
      cuotas
        .filter((cuota) => !cuota.pagado)
        .reduce((sum, cuota) => sum + toNumberOrZero(cuota.montoCuota), 0),
    );
  }

  return redondearDinero(prestamo?.montoAprobado ?? prestamo?.montoSolicitado ?? 0);
};

const construirResumenDeudaUsuario = async (usuarioId) => {
  const usuario = await User.findByPk(usuarioId, {
    attributes: ['id', 'nombre', 'apellido', 'email', 'saldo'],
  });

  if (!usuario) {
    return null;
  }

  const prestamosUsuario = await Loan.findAll({
    where: {
      usuarioId,
      estado: { [Op.notIn]: ['completado', 'rechazado'] },
    },
    include: [{
      model: CuotaPrestamo,
      as: 'cuotasPrestamo',
      required: false,
    }],
    order: [['createdAt', 'DESC']],
  });

  const prestamosNoPlan = prestamosUsuario.filter(
    (prestamo) => !String(prestamo.numeroReferencia || '').startsWith('PLAN-PAGO'),
  );
  const planesPagoActivos = prestamosUsuario.filter(
    (prestamo) => String(prestamo.numeroReferencia || '').startsWith('PLAN-PAGO'),
  );

  const sandboxPrestamosSinCuotas = prestamosNoPlan.filter((prestamo) => {
    const referencia = String(prestamo.numeroReferencia || '');
    const cuotas = Array.isArray(prestamo.cuotasPrestamo) ? prestamo.cuotasPrestamo : [];
    return referencia.startsWith('SANDBOX-') && cuotas.length === 0 && String(prestamo.estado || '').toLowerCase() === 'aprobado';
  });

  const saldoWallet = redondearDinero(usuario.saldo || 0);
  const saldoPrestamoActual = redondearDinero(usuario.saldoPrestamo || 0);
  
  // Deuda de saldo negativo = wallet negativo (solo si no está en un plan)
  const deudaSaldoNegativo = saldoWallet < 0 ? redondearDinero(Math.abs(saldoWallet)) : 0;
  
  // Deuda de préstamos = saldoPrestamo negativo (INCLUYE todos los planes consolidados)
  const deudaPrestamos = saldoPrestamoActual < 0 ? redondearDinero(Math.abs(saldoPrestamoActual)) : 0;
  const deudaPlanesPago = deudaPrestamos; // En la nueva lógica, todo es plan consolidado

  const saldoPrestamo = deudaPrestamos;
  const saldoDisponible = redondearDinero(saldoWallet - saldoPrestamo);
  const deudaConsolidable = deudaPrestamos; // Solo lo que está en saldoPrestamo
  const deudaTotalActual = redondearDinero(deudaSaldoNegativo + deudaPrestamos);

  return {
    usuarioId: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    saldoWallet,
    saldoPrestamo: saldoPrestamoActual,
    deudaSaldoNegativo,
    deudaPrestamos,
    deudaPlanesPago,
    deudaConsolidable,
    deudaTotalActual,
    saldoDisponible,
    prestamosActivos: prestamosNoPlan.length,
    planesPagoActivos: planesPagoActivos.length,
    puedeCrearPlanPago: deudaPrestamos > 0 && planesPagoActivos.length === 0,
    sandboxPrestamosSinCuotas: sandboxPrestamosSinCuotas.length,
    sandboxPrestamosSinCuotasIds: sandboxPrestamosSinCuotas.map((prestamo) => prestamo.id),
  };
};

exports.obtenerResumenDeudaUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const resumen = await construirResumenDeudaUsuario(id);

    if (!resumen) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
    }

    res.json({ exito: true, resumen });
  } catch (error) {
    console.error('❌ Error obteniendo resumen de deuda del usuario:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener resumen de deuda', error: error.message });
  }
};

exports.depurarPrestamosSandboxUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const resumen = await construirResumenDeudaUsuario(id);

    if (!resumen) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
    }

    const ids = resumen.sandboxPrestamosSinCuotasIds || [];
    if (ids.length === 0) {
      return res.json({ exito: true, mensaje: 'No hay préstamos sandbox sin cuotas para depurar', actualizados: 0, resumen });
    }

    const [actualizados] = await Loan.update(
      { estado: 'completado' },
      { where: { id: { [Op.in]: ids } } },
    );

    const resumenActualizado = await construirResumenDeudaUsuario(id);

    res.json({
      exito: true,
      mensaje: 'Préstamos sandbox sin cuotas depurados correctamente',
      actualizados,
      resumen: resumenActualizado,
    });
  } catch (error) {
    console.error('❌ Error depurando préstamos sandbox del usuario:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al depurar préstamos sandbox', error: error.message });
  }
};

const construirCheckoutPlanPago = (prestamo, cuotas = [], saldoUsuarioActual = null) => {
  const esPlanDePago = String(prestamo?.numeroReferencia || '').startsWith('PLAN-PAGO');
  if (!esPlanDePago) {
    return null;
  }

  const deudaSaldoNegativoInicial = toNumberOrZero(prestamo.deudaSaldoNegativoInicial);
  const deudaPrestamosInicial = toNumberOrZero(prestamo.deudaPrestamosInicial);
  const deudaTotalInicial = deudaSaldoNegativoInicial + deudaPrestamosInicial;

  const totalPagado = cuotas
    .filter((cuota) => Boolean(cuota.pagado))
    .reduce((sum, cuota) => sum + toNumberOrZero(cuota.montoCuota ?? cuota.monto), 0);

  const pagoAplicable = Math.min(totalPagado, deudaTotalInicial);
  const saldoNegativoRestantePorPagos = Math.max(0, deudaSaldoNegativoInicial - pagoAplicable);
  const saldoActualNumerico = toNumberOrZero(saldoUsuarioActual);
  const saldoNegativoRestante = Number.isFinite(saldoActualNumerico)
    ? Math.max(0, -saldoActualNumerico)
    : saldoNegativoRestantePorPagos;
  const remanenteTrasSaldo = Math.max(0, pagoAplicable - deudaSaldoNegativoInicial);
  const saldoPrestamoRestante = Math.max(0, deudaPrestamosInicial - remanenteTrasSaldo);

  return {
    deudaSaldoNegativoInicial: parseFloat(deudaSaldoNegativoInicial.toFixed(2)),
    deudaPrestamosInicial: parseFloat(deudaPrestamosInicial.toFixed(2)),
    deudaTotalInicial: parseFloat(deudaTotalInicial.toFixed(2)),
    totalPagado: parseFloat(totalPagado.toFixed(2)),
    saldoNegativoRestante: parseFloat(saldoNegativoRestante.toFixed(2)),
    saldoPrestamoRestante: parseFloat(saldoPrestamoRestante.toFixed(2)),
    deudaTotalRestante: parseFloat((saldoNegativoRestante + saldoPrestamoRestante).toFixed(2)),
    saldoNegativoSaldado: saldoNegativoRestante <= 0,
    saldoPrestamoSaldado: saldoPrestamoRestante <= 0,
  };
};

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
    const { nombre, apellido, email, cedula, telefono, direccion, saldo, emailVerificado } = req.body;

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
          planPagoCheckout: construirCheckoutPlanPago(prestamo, cuotas, usuario?.saldo),
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

exports.listarCuotasVencidas = async (req, res) => {
  try {
    const limiteSolicitado = parseInt(req.query.limit, 10);
    const limite = Number.isFinite(limiteSolicitado)
      ? Math.min(Math.max(limiteSolicitado, 1), 50)
      : 20;

    const cuotas = await CuotaPrestamo.findAll({
      where: {
        pagado: false,
        fechaVencimiento: { [Op.lt]: new Date() }
      },
      order: [['fechaVencimiento', 'ASC']],
      limit: limite,
    });

    if (cuotas.length === 0) {
      return res.json({
        exito: true,
        total: 0,
        cuotas: []
      });
    }

    const prestamoIds = [...new Set(cuotas.map((cuota) => cuota.prestamoId))];
    const prestamos = await Loan.findAll({
      where: { id: { [Op.in]: prestamoIds } }
    });

    const usuarioIds = [...new Set(prestamos.map((prestamo) => prestamo.usuarioId))];
    const usuarios = usuarioIds.length > 0
      ? await User.findAll({
          where: { id: { [Op.in]: usuarioIds } },
          attributes: ['id', 'nombre', 'apellido', 'email']
        })
      : [];

    const prestamosMap = new Map(prestamos.map((prestamo) => [prestamo.id, prestamo]));
    const usuariosMap = new Map(usuarios.map((usuario) => [usuario.id, usuario]));
    const ahora = Date.now();

    const cuotasFormateadas = cuotas.map((cuota) => {
      const prestamo = prestamosMap.get(cuota.prestamoId);
      const usuario = prestamo ? usuariosMap.get(prestamo.usuarioId) : null;
      const fechaVencimiento = cuota.fechaVencimiento ? new Date(cuota.fechaVencimiento) : null;
      const diasVencida = fechaVencimiento
        ? Math.max(0, Math.floor((ahora - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      const clienteNombre = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
        || usuario?.email
        || 'Cliente';

      return {
        id: cuota.id,
        prestamoId: cuota.prestamoId,
        numeroCuota: cuota.numeroCuota,
        monto: parseFloat(cuota.montoCuota || 0),
        fechaVencimiento: formatearFechaCorta(cuota.fechaVencimiento),
        diasVencida,
        clienteNombre,
        clienteEmail: usuario?.email || null,
      };
    });

    res.json({
      exito: true,
      total: cuotasFormateadas.length,
      cuotas: cuotasFormateadas,
    });
  } catch (error) {
    console.error('❌ Error listando cuotas vencidas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener cuotas vencidas',
      error: error.message
    });
  }
};

// Crear préstamo desde admin (con cuotas)
exports.crearPrestamoAdmin = async (req, res) => {
  try {
    const { usuarioEmail, usuarioId, monto, plazo, tasaInteres, fechaPrimerVencimiento, sandbox, usarDeudaActual } = req.body;

    if ((!usuarioEmail && !usuarioId) || !plazo || (!usarDeudaActual && !monto)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Faltan datos obligatorios (usuario, plazo y monto si no es plan de pago)'
      });
    }
    const plazoNumero = parseInt(plazo, 10);
    const tasaNumero = tasaInteres !== undefined && tasaInteres !== null && tasaInteres !== ''
      ? parseFloat(tasaInteres)
      : 5;

    if (!Number.isFinite(plazoNumero) || plazoNumero <= 0) {
      return res.status(400).json({ exito: false, mensaje: 'Plazo inválido' });
    }

    const usuario = usuarioId
      ? await User.findByPk(usuarioId)
      : await User.findOne({ where: { email: usuarioEmail } });

    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
    }

    const saldoActualUsuario = redondearDinero(usuario.saldo || 0);
    const saldoPrestamoUsuario = redondearDinero(usuario.saldoPrestamo || 0);
    const deudaActualUsuario = saldoActualUsuario < 0 ? redondearDinero(Math.abs(saldoActualUsuario)) : 0;
    
    // Para planes de pago: usar saldoPrestamo como fuente de deuda
    let deudaPrestamosPendiente = saldoPrestamoUsuario < 0 ? redondearDinero(Math.abs(saldoPrestamoUsuario)) : 0;

    let prestamosAConsolidar = [];
    if (usarDeudaActual) {
      prestamosAConsolidar = await Loan.findAll({
        where: {
          usuarioId: usuario.id,
          estado: { [Op.notIn]: ['completado', 'rechazado'] },
        },
      });

      prestamosAConsolidar = prestamosAConsolidar.filter(
        (prestamo) => !String(prestamo.numeroReferencia || '').startsWith('PLAN-PAGO'),
      );
    }

    let deudaTotalConsolidada = 0;
    if (usarDeudaActual) {
      // El plan SOLO consolida saldoPrestamo (deuda de préstamos)
      deudaTotalConsolidada = deudaPrestamosPendiente;
    }

    if (usarDeudaActual) {
      const planesActivos = await Loan.findAll({
        where: {
          usuarioId: usuario.id,
          estado: { [Op.ne]: 'completado' },
          numeroReferencia: { [Op.like]: 'PLAN-PAGO-%' },
        },
      });

      // Si ya no hay deuda total, cerramos cualquier plan activo residual.
      if (deudaTotalConsolidada <= 0 && planesActivos.length > 0) {
        const idsPlanes = planesActivos.map((plan) => plan.id);

        await Loan.update(
          { estado: 'completado' },
          { where: { id: { [Op.in]: idsPlanes } } },
        );

        await CuotaPrestamo.update(
          {
            pagado: true,
            fechaPago: new Date(),
            metodoPago: 'Ajuste',
            notas: 'Plan cerrado automáticamente: saldo del usuario en 0',
          },
          {
            where: {
              prestamoId: { [Op.in]: idsPlanes },
              pagado: false,
            },
          },
        );
      }

      // Si aún hay deuda, no permitir duplicar planes activos.
      if (deudaTotalConsolidada > 0 && planesActivos.length > 0) {
        return res.status(400).json({
          exito: false,
          mensaje: 'El usuario ya tiene un plan de pago activo. Debe completarlo antes de crear otro.'
        });
      }
    }

    const montoNumero = usarDeudaActual
      ? deudaTotalConsolidada
      : parseFloat(monto);

    // Regla BanExclusivo: un plan de pago salda saldo negativo hasta 0, sin interés adicional.
    const tasaAplicable = usarDeudaActual ? 0 : tasaNumero;

    if (usarDeudaActual && montoNumero <= 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El usuario no tiene deuda pendiente para convertir en plan de pago'
      });
    }

    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      return res.status(400).json({ exito: false, mensaje: 'Monto inválido' });
    }

    const prestamo = await Loan.create({
      usuarioId: usuario.id,
      montoSolicitado: montoNumero,
      montoAprobado: montoNumero,
      deudaSaldoNegativoInicial: usarDeudaActual ? deudaActualUsuario : 0,
      deudaPrestamosInicial: usarDeudaActual ? deudaPrestamosPendiente : 0,
      tasaInteres: tasaAplicable,
      plazo: plazoNumero,
      estado: 'aprobado',
      bancoDespositante: process.env.BANCO_NOMBRE,
      cuentaBancaria: process.env.BANCO_CUENTA,
      emailAprobacion: process.env.ADMIN_EMAIL,
      fechaAprobacion: new Date(),
      numeroReferencia: `${sandbox ? 'SANDBOX' : (usarDeudaActual ? 'PLAN-PAGO' : 'PREST-ADMIN')}-${Date.now().toString().slice(-8)}`
    });

    const tasaMensual = tasaAplicable > 0 ? (tasaAplicable / 12 / 100) : 0;
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

    if (!sandbox && usarDeudaActual && prestamosAConsolidar.length > 0) {
      const idsPrestamos = prestamosAConsolidar.map((prestamo) => prestamo.id);

      await Loan.update(
        { estado: 'completado' },
        { where: { id: { [Op.in]: idsPrestamos } } },
      );

      await CuotaPrestamo.update(
        {
          pagado: true,
          fechaPago: new Date(),
          metodoPago: 'Consolidación',
          notas: `Consolidado en plan de pago ${prestamo.numeroReferencia}`,
        },
        {
          where: {
            prestamoId: { [Op.in]: idsPrestamos },
            pagado: false,
          },
        },
      );

      // 🔧 CRÍTICO: Al consolidar, ajustamos saldoPrestamo a 0
      // porque la deuda ahora está en el plan de pago
      usuario.saldoPrestamo = 0;
      await usuario.save();
    }

    if (!sandbox && !usarDeudaActual) {
      usuario.saldo = parseFloat(usuario.saldo || 0) + montoNumero;
      await usuario.save();
    }

    const resumenActualizado = await construirResumenDeudaUsuario(usuario.id);

    res.json({
      exito: true,
      mensaje: usarDeudaActual
        ? '✅ Plan de pago creado a partir de la deuda actual del usuario'
        : '✅ Préstamo creado con cuotas',
      prestamo: prestamo.toJSON(),
      sandbox: !!sandbox,
      usarDeudaActual: !!usarDeudaActual,
      deudaActualUsuario: parseFloat(deudaActualUsuario.toFixed(2)),
      deudaPrestamosPendiente: parseFloat(deudaPrestamosPendiente.toFixed(2)),
      deudaConsolidadaTotal: parseFloat(montoNumero.toFixed(2)),
      cuotas: cuotas.map(c => c.toJSON()),
      resumenActualizado
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
      attributes: ['id', 'nombre', 'apellido', 'email', 'telefono', 'saldo']
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
        cuotas,
        planPagoCheckout: construirCheckoutPlanPago(prestamo, cuotas, usuario?.saldo),
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
      console.log('⚠️ Cuota ya pagada');
      return res.status(400).json({
        exito: false,
        mensaje: 'Esta cuota ya está pagada'
      });
    }

    const prestamo = await Loan.findByPk(cuota.prestamoId);
    const esPlanDePago = Boolean(prestamo && String(prestamo.numeroReferencia || '').startsWith('PLAN-PAGO'));
    let abonoSaldo = 0;
    let nuevoSaldoUsuario = null;
    let planAutoCerradoPorSaldo = false;

    if (esPlanDePago && prestamo) {
      const usuario = await User.findByPk(prestamo.usuarioId);
      if (usuario) {
        const saldoPrestamoActual = redondearDinero(usuario.saldoPrestamo || 0);
        const montoCuota = redondearDinero(cuota.montoCuota || 0);

        if (saldoPrestamoActual < 0 && montoCuota > 0) {
          // Cada pago de cuota reduce el saldoPrestamo (deuda de préstamos)
          // De -100 va a -80, -60, etc., hasta 0
          abonoSaldo = redondearDinero(Math.min(Math.abs(saldoPrestamoActual), montoCuota));
          usuario.saldoPrestamo = redondearDinero(saldoPrestamoActual + abonoSaldo);

          // Evitar residuos como -0.01 por redondeo
          if (usuario.saldoPrestamo > -0.01 && usuario.saldoPrestamo < 0.01) {
            usuario.saldoPrestamo = 0;
          }

          await usuario.save();
        }

        nuevoSaldoUsuario = redondearDinero(usuario.saldoPrestamo || 0);
      }
    }

    // Actualizar cuota
    cuota.pagado = true;
    cuota.fechaPago = new Date();
    cuota.metodoPago = metodoPago || 'Efectivo';
    cuota.referenciaPago = referenciaPago || null;
    cuota.notas = notas || null;
    
    console.log('💾 Guardando cuota actualizada...');
    await cuota.save();
    console.log('✅ Cuota guardada correctamente');

    // Verificar si todas las cuotas están pagadas
    const todasCuotas = await CuotaPrestamo.findAll({
      where: { prestamoId: cuota.prestamoId }
    });

    let todasPagadas = todasCuotas.every(c => c.pagado);

    if (esPlanDePago && prestamo) {
      const usuarioPlan = await User.findByPk(prestamo.usuarioId);
      const saldoPlan = usuarioPlan ? redondearDinero(usuarioPlan.saldo || 0) : null;
      const checkoutPlan = construirCheckoutPlanPago(prestamo, todasCuotas, saldoPlan);

      // Regla de negocio: el plan se cierra cuando la deuda consolidada total llega a 0.
      if (checkoutPlan && checkoutPlan.deudaTotalRestante <= 0) {
        await CuotaPrestamo.update(
          {
            pagado: true,
            fechaPago: new Date(),
            metodoPago: 'Liquidación',
            notas: 'Cierre automático de plan: saldo del usuario llegó a 0',
          },
          {
            where: {
              prestamoId: cuota.prestamoId,
              pagado: false,
            },
          },
        );

        todasPagadas = true;
        planAutoCerradoPorSaldo = true;
      }
    }

    if (todasPagadas) {
      // Actualizar estado del préstamo a "completado" (valor válido del ENUM)
      if (prestamo) {
        prestamo.estado = 'completado';
        await prestamo.save();
        console.log('✅ Préstamo marcado como pagado');
      }
    }

    const resumenUsuario = prestamo
      ? await construirResumenDeudaUsuario(prestamo.usuarioId)
      : null;

    res.json({
      exito: true,
      mensaje: '✅ Pago registrado exitosamente',
      cuota,
      prestamoCompletado: todasPagadas,
      esPlanDePago,
      abonoSaldo,
      nuevoSaldoUsuario,
      planAutoCerradoPorSaldo,
      dashboardUsuario: resumenUsuario,
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
