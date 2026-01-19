const Transfer = require('../models/Transfer');
const User = require('../models/User');
const carterCardService = require('../services/carterCardService');

// Transferencia con Carter Card
const transferenciasConCarterCard = async (req, res) => {
  try {
    const { numeroTarjeta, monto, concepto, cedula_destinatario } = req.body;
    const usuarioId = req.usuario.id;

    if (!numeroTarjeta || !monto || monto <= 0) {
      return res.status(400).json({ mensaje: 'Datos de transferencia inválidos' });
    }

    // Validar tarjeta Carter Card
    const tarjetaValida = await carterCardService.validarTarjeta(numeroTarjeta);

    // Procesar pago con Carter Card
    const resultado = await carterCardService.procesarPago(numeroTarjeta, monto, concepto);

    // Buscar usuario actual
    const usuario = await User.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Si hay destinatario por cédula (transferencia bancaria con fondos de Carter Card)
    if (cedula_destinatario) {
      const destinatario = await User.findOne({ where: { cedula: cedula_destinatario } });
      if (!destinatario) {
        return res.status(404).json({ mensaje: 'Usuario destinatario no encontrado' });
      }

      if (usuario.id === destinatario.id) {
        return res.status(400).json({ mensaje: 'No puedes transferir a tu propia cuenta' });
      }

      // Realizar transferencia
      usuario.saldo = parseFloat(usuario.saldo) + monto; // Se suma el monto de Carter Card
      destinatario.saldo = parseFloat(destinatario.saldo) + monto;

      await usuario.save();
      await destinatario.save();

      // Registrar la transferencia
      const transferencia = await Transfer.create({
        remitenteId: usuario.id,
        destinatarioId: destinatario.id,
        monto,
        concepto: concepto || 'Transferencia con Carter Card',
        estado: 'exitosa',
      });

      return res.status(201).json({
        mensaje: 'Transferencia realizada exitosamente con Carter Card',
        transferencia: {
          id: transferencia.id,
          monto: transferencia.monto,
          destinatario: destinatario.nombre,
          concepto: transferencia.concepto,
          fecha: transferencia.createdAt,
          numeroReferencia: resultado.numeroReferencia,
          tarjetaUltimos4: resultado.ultimos4,
        },
      });
    } else {
      // Solo se procesó el pago con Carter Card sin transferencia bancaria
      return res.status(201).json({
        mensaje: 'Pago procesado exitosamente con Carter Card',
        pago: {
          numeroReferencia: resultado.numeroReferencia,
          monto: resultado.monto,
          tarjeta: resultado.tarjeta,
          concepto,
          timestamp: resultado.timestamp,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener historial de Carter Card
const obtenerHistorialCarterCard = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    
    // Aquí iría la lógica para obtener el historial de transacciones con Carter Card
    res.json({
      mensaje: 'Integremos la API real de Carter Card para obtener el historial',
      transacciones: [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  transferenciasConCarterCard,
  obtenerHistorialCarterCard,
};
