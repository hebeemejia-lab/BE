const express = require('express');
const router = express.Router();
const {
  obtenerPaises,
  obtenerTasaCambio,
  crearTransferenciaInternacional,
  obtenerHistorialInternacional,
  consultarEstadoTransferencia,
} = require('../controllers/transferenciaInternacionalController');
const verificarToken = require('../middleware/authMiddleware');

// Todas requieren autenticación
router.get('/paises', verificarToken, obtenerPaises);
router.get('/tasa-cambio', verificarToken, obtenerTasaCambio);
router.post('/crear', verificarToken, crearTransferenciaInternacional);
router.get('/historial', verificarToken, obtenerHistorialInternacional);
router.get('/estado/:id', verificarToken, consultarEstadoTransferencia);

module.exports = router;
