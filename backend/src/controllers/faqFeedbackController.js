// Controlador de Feedback del FAQ
const FAQFeedback = require('../models/FAQFeedback');

// Guardar feedback de usuario
exports.guardarFeedback = async (req, res) => {
  try {
    const { faqId, pregunta, util, comentario, email } = req.body;

    if (!faqId || !pregunta) {
      return res.status(400).json({
        exito: false,
        mensaje: 'faqId y pregunta son requeridos'
      });
    }

    const feedback = await FAQFeedback.create({
      faqId,
      pregunta,
      util: util !== undefined ? util : null,
      comentario: comentario || null,
      email: email || null
    });

    res.json({
      exito: true,
      mensaje: '✅ Gracias por tu feedback',
      feedback
    });

  } catch (error) {
    console.error('❌ Error guardando feedback:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al guardar feedback',
      error: error.message
    });
  }
};

// Obtener estadísticas de una pregunta FAQ
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const { faqId } = req.params;

    const feedbacks = await FAQFeedback.findAll({
      where: { faqId }
    });

    const total = feedbacks.length;
    const utiles = feedbacks.filter(f => f.util === true).length;
    const noUtiles = feedbacks.filter(f => f.util === false).length;
    const sinVoto = feedbacks.filter(f => f.util === null).length;
    const comentarios = feedbacks.filter(f => f.comentario).length;

    const porcentajeUtil = total > 0 ? ((utiles / total) * 100).toFixed(1) : 0;

    res.json({
      exito: true,
      faqId,
      estadisticas: {
        total,
        utiles,
        noUtiles,
        sinVoto,
        comentarios,
        porcentajeUtil: `${porcentajeUtil}%`
      },
      ultimosFeedbacks: feedbacks.slice(-5).map(f => ({
        util: f.util,
        comentario: f.comentario,
        fecha: f.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// Obtener todas las estadísticas del FAQ
exports.obtenerTodasEstadisticas = async (req, res) => {
  try {
    const feedbacks = await FAQFeedback.findAll();

    // Agrupar por faqId
    const stats = {};
    feedbacks.forEach(f => {
      if (!stats[f.faqId]) {
        stats[f.faqId] = {
          pregunta: f.pregunta,
          total: 0,
          utiles: 0,
          noUtiles: 0,
          sinVoto: 0,
          comentarios: 0
        };
      }
      stats[f.faqId].total++;
      if (f.util === true) stats[f.faqId].utiles++;
      if (f.util === false) stats[f.faqId].noUtiles++;
      if (f.util === null) stats[f.faqId].sinVoto++;
      if (f.comentario) stats[f.faqId].comentarios++;
    });

    // Convertir a array y calcular porcentaje
    const estadisticas = Object.entries(stats).map(([faqId, data]) => ({
      faqId: parseInt(faqId),
      pregunta: data.pregunta,
      total: data.total,
      utiles: data.utiles,
      noUtiles: data.noUtiles,
      sinVoto: data.sinVoto,
      comentarios: data.comentarios,
      porcentajeUtil: data.total > 0 ? ((data.utiles / data.total) * 100).toFixed(1) : 0
    })).sort((a, b) => b.total - a.total);

    res.json({
      exito: true,
      totalFeedbacks: feedbacks.length,
      totalPreguntas: Object.keys(stats).length,
      estadisticas
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// Obtener comentarios sin respuesta (útiles para mejorar FAQ)
exports.obtenerComentariosNoRespondidos = async (req, res) => {
  try {
    const comentarios = await FAQFeedback.findAll({
      where: { 
        comentario: {
          [require('sequelize').Op.not]: null
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    res.json({
      exito: true,
      total: comentarios.length,
      comentarios: comentarios.map(c => ({
        id: c.id,
        pregunta: c.pregunta,
        comentario: c.comentario,
        util: c.util,
        fecha: c.createdAt,
        email: c.email
      }))
    });

  } catch (error) {
    console.error('❌ Error obteniendo comentarios:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener comentarios',
      error: error.message
    });
  }
};
