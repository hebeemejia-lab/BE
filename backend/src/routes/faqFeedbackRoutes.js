// Rutas del Feedback del FAQ
const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/faqFeedbackController');

// 💬 Guardar feedback de usuario
router.post('/guardar', feedbackController.guardarFeedback);

// 📊 Estadísticas de una pregunta específica
router.get('/estadisticas/:faqId', feedbackController.obtenerEstadisticas);

// 📈 Todas las estadísticas del FAQ
router.get('/admin/estadisticas-general', feedbackController.obtenerTodasEstadisticas);

// 💡 Comentarios de usuarios (para mejorar FAQ)
router.get('/admin/comentarios', feedbackController.obtenerComentariosNoRespondidos);

module.exports = router;
