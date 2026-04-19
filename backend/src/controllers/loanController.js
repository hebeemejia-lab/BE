const Loan = require('../models/Loan');
const { User } = require('../models');
const CuotaPrestamo = require('../models/CuotaPrestamo');
const emailService = require('../services/emailService');

const toNumberOrZero = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundMoney = (value) => parseFloat(toNumberOrZero(value).toFixed(2));

// Solicitar préstamo
const solicitarPrestamo = async (req, res) => {
  try {
    const { montoSolicitado, plazo } = req.body;
    const usuarioId = req.usuario.id;

    if (!montoSolicitado || !plazo || montoSolicitado < 100) {
      return res.status(400).json({ mensaje: 'Datos de préstamo inválidos' });
    }

    if (![6, 12, 24, 36, 48, 60].includes(plazo)) {
      return res.status(400).json({ mensaje: 'Plazo no válido' });
    }

    const usuario = await User.findByPk(usuarioId);

    const prestamo = await Loan.create({
      usuarioId,
      montoSolicitado,
      plazo,
      bancoDespositante: process.env.BANCO_NOMBRE,
      cuentaBancaria: process.env.BANCO_CUENTA,
      emailAprobacion: process.env.ADMIN_EMAIL,
    });

    // Enviar notificación al admin
    await emailService.enviarNotificacionSolicitud(usuario, prestamo);

    res.status(201).json({
      mensaje: 'Solicitud de préstamo creada. El administrador la revisará pronto.',
      prestamo: {
        id: prestamo.id,
        montoSolicitado: prestamo.montoSolicitado,
        plazo: prestamo.plazo,
        estado: prestamo.estado,
        bancoDespositante: prestamo.bancoDespositante,
        cuentaBancaria: prestamo.cuentaBancaria,
        fechaSolicitud: prestamo.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener préstamos del usuario
const obtenerMisPrestamos = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const usuario = await User.findByPk(usuarioId, { attributes: ['id', 'saldo'] });
    const saldoUsuario = roundMoney(usuario?.saldo || 0);

    const prestamos = await Loan.findAll({
      where: { usuarioId },
      include: [{
        model: CuotaPrestamo,
        as: 'cuotasPrestamo',
        required: false,
      }],
      order: [['createdAt', 'DESC']],
    });

    const prestamosNormalizados = await Promise.all(prestamos.map(async (prestamo) => {
      const esPlanPago = String(prestamo.numeroReferencia || '').startsWith('PLAN-PAGO');
      const estado = String(prestamo.estado || '').toLowerCase();
      const cuotas = Array.isArray(prestamo.cuotasPrestamo) ? prestamo.cuotasPrestamo : [];

      const montoPendienteCuotas = cuotas
        .filter((cuota) => !cuota.pagado)
        .reduce((sum, cuota) => sum + toNumberOrZero(cuota.montoCuota), 0);

      let montoPendiente = cuotas.length > 0
        ? roundMoney(montoPendienteCuotas)
        : roundMoney(prestamo.montoAprobado ?? prestamo.montoSolicitado ?? 0);

      if (estado === 'completado' || estado === 'pagado' || estado === 'rechazado') {
        montoPendiente = 0;
      }

      // Cierra planes viejos que quedaron activos aunque el saldo negativo ya fue saldado.
      if (esPlanPago && saldoUsuario >= 0 && estado !== 'completado' && estado !== 'pagado') {
        await Loan.update(
          { estado: 'completado' },
          { where: { id: prestamo.id } },
        );

        await CuotaPrestamo.update(
          {
            pagado: true,
            fechaPago: new Date(),
            metodoPago: 'Ajuste',
            notas: 'Cierre automático en consulta: saldo del usuario en 0',
          },
          {
            where: {
              prestamoId: prestamo.id,
              pagado: false,
            },
          },
        );

        montoPendiente = 0;
        prestamo.estado = 'completado';
      }

      const estadoFinal = String(prestamo.estado || '').toLowerCase();
      const activoVisual = estadoFinal !== 'completado'
        && estadoFinal !== 'pagado'
        && estadoFinal !== 'rechazado'
        && montoPendiente > 0;

      return {
        ...prestamo.toJSON(),
        montoPendiente,
        activoVisual,
      };
    }));

    res.json(prestamosNormalizados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los préstamos (admin)
const obtenerTodosPrestamos = async (req, res) => {
  try {
    const prestamos = await Loan.findAll({
      order: [['createdAt', 'DESC']],
    });

    const resultado = await Promise.all(prestamos.map(async (loan) => {
      const usuario = await User.findByPk(loan.usuarioId, { attributes: ['nombre', 'email', 'cedula'] });
      return {
        ...loan.toJSON(),
        usuario,
      };
    }));

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Aprobar préstamo
const aprobarPrestamo = async (req, res) => {
  try {
    const { prestamoId, montoAprobado } = req.body;

    const prestamo = await Loan.findByPk(prestamoId);
    if (!prestamo) {
      return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
    }

    if (prestamo.estado !== 'pendiente') {
      return res.status(400).json({ mensaje: 'El préstamo ya ha sido procesado' });
    }

    const monto = montoAprobado || prestamo.montoSolicitado;
    if (monto > prestamo.montoSolicitado) {
      return res.status(400).json({ mensaje: 'El monto aprobado no puede exceder lo solicitado' });
    }

    prestamo.estado = 'aprobado';
    prestamo.montoAprobado = monto;
    prestamo.fechaAprobacion = new Date();
    prestamo.numeroReferencia = `PREST-${prestamo.id}-${Date.now().toString().slice(-8)}`;

    const tasaMensual = prestamo.tasaInteres / 12 / 100;
    const numeroCuotas = prestamo.plazo;
    const cuotaMensual =
      (monto * tasaMensual * Math.pow(1 + tasaMensual, numeroCuotas)) /
      (Math.pow(1 + tasaMensual, numeroCuotas) - 1);

    prestamo.cuotas = Array.from({ length: numeroCuotas }, (_, i) => ({
      numero: i + 1,
      monto: Math.round(cuotaMensual * 100) / 100,
      fechaVencimiento: new Date(
        new Date().getTime() + (i + 1) * 30 * 24 * 60 * 60 * 1000
      ),
      pagado: false,
    }));

    const usuario = await User.findByPk(prestamo.usuarioId);
    // NO agregamos el monto al saldo porque es modo Sandbox
    // y la API de PayPal se confunde con los montos de préstamos
    // El préstamo se aprueba pero NO afecta el balance de la cuenta

    await prestamo.save();

    // Enviar confirmación al usuario
    await emailService.enviarConfirmacionAprobacion(usuario, {
      ...prestamo.toJSON(),
      cuotaMensual: Math.round(cuotaMensual * 100) / 100,
    });

    res.json({
      mensaje: 'Préstamo aprobado exitosamente. Notificación enviada al usuario.',
      prestamo: {
        id: prestamo.id,
        montoAprobado: prestamo.montoAprobado,
        tasaInteres: prestamo.tasaInteres,
        cuotaMensual: Math.round(cuotaMensual * 100) / 100,
        plazo: prestamo.plazo,
        estado: prestamo.estado,
        bancoDespositante: prestamo.bancoDespositante,
        cuentaBancaria: prestamo.cuentaBancaria,
        numeroReferencia: prestamo.numeroReferencia,
        fechaAprobacion: prestamo.fechaAprobacion,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Rechazar préstamo
const rechazarPrestamo = async (req, res) => {
  try {
    const { prestamoId, motivo } = req.body;

    const prestamo = await Loan.findByPk(prestamoId);
    if (!prestamo) {
      return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
    }

    if (prestamo.estado !== 'pendiente') {
      return res.status(400).json({ mensaje: 'El préstamo ya ha sido procesado' });
    }

    prestamo.estado = 'rechazado';
    prestamo.motivoRechazo = motivo || 'No especificado';

    await prestamo.save();

    const usuario = await User.findByPk(prestamo.usuarioId);
    await emailService.enviarRechazo(usuario, prestamo);

    res.json({
      mensaje: 'Préstamo rechazado. Notificación enviada al usuario.',
      prestamo: {
        id: prestamo.id,
        estado: prestamo.estado,
        motivoRechazo: prestamo.motivoRechazo,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  solicitarPrestamo,
  obtenerMisPrestamos,
  obtenerTodosPrestamos,
  aprobarPrestamo,
  rechazarPrestamo,
};
