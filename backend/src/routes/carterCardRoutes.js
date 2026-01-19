const express = require('express');
const router = express.Router();
const { transferenciasConCarterCard, obtenerHistorialCarterCard } = require('../controllers/carterCardController');
const verificarToken = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.post('/transferir', verificarToken, transferenciasConCarterCard);
router.get('/historial', verificarToken, obtenerHistorialCarterCard);

module.exports = router;
