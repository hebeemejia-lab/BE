// Rutas del Bot FAQ
const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');

// 🤖 Consultar FAQ (pregunta del usuario)
router.post('/consultar', faqController.consultarFAQ);

// 📋 Listar todas las categorías
router.get('/categorias', faqController.listarCategorias);

// 📂 Obtener preguntas de una categoría específica
router.get('/categoria/:categoria', faqController.obtenerCategoria);

// ⭐ Preguntas más populares
router.get('/populares', faqController.preguntasPopulares);

// 📚 Obtener todas las FAQs (lista simplificada)
router.get('/todas', faqController.obtenerTodas);

module.exports = router;
