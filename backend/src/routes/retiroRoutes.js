const express = require('express');
const router = express.Router();
const { procesarRetiro, obtenerRetiros, obtenerCuentaPrincipal } = require('../controllers/retiroController');
const verificarToken = require('../middleware/authMiddleware');

// Todas requieren autenticación
router.post('/procesar', verificarToken, procesarRetiro);
router.get('/historial', verificarToken, obtenerRetiros);
router.get('/cuenta-principal', verificarToken, obtenerCuentaPrincipal);

module.exports = router;
