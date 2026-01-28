const express = require('express');
const router = express.Router();
const {
  crearRecargaStripe,
  crearRecargaRapyd,
  procesarRecargaTarjeta,
  procesarRecargaExitosa,
  obtenerRecargas,
  canjearcoCodigo,
  generarCodigos,
} = require('../controllers/recargaController');
const verificarToken = require('../middleware/authMiddleware');


// Todas requieren autenticación
router.post('/crear', verificarToken, crearRecargaStripe);
router.post('/crear-rapyd', verificarToken, crearRecargaRapyd);
// router.post('/crear-2checkout', verificarToken, require('../controllers/recargaController').crearRecargaTwoCheckout);
router.post('/procesar-tarjeta', verificarToken, procesarRecargaTarjeta);
router.post('/procesar', verificarToken, procesarRecargaExitosa);
router.get('/historial', verificarToken, obtenerRecargas);
router.post('/canjear-codigo', verificarToken, canjearcoCodigo);
router.post('/generar-codigos', verificarToken, generarCodigos); // Solo admin

module.exports = router;
