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
  webhookRapyd,
} = require('../controllers/recargaController');
const verificarToken = require('../middleware/authMiddleware');

console.log('🔄 Recarga routes loaded with crearRecargaRapyd:', typeof crearRecargaRapyd);

// Endpoint de debug - muestra rutas disponibles
router.get('/debug', (req, res) => {
  res.json({
    message: 'Recargas Routes v2.2',
    endpoints: [
      'POST /crear',
      'POST /crear-rapyd ← ENDPOINT RAPYD',
      'POST /webhook-rapyd ← WEBHOOK RAPYD',
      'POST /procesar-tarjeta',
      'POST /procesar',
      'GET /historial',
      'POST /canjear-codigo',
      'POST /generar-codigos'
    ]
  });
});

// Webhook de Rapyd (SIN autenticación - viene desde Rapyd)
router.post('/webhook-rapyd', webhookRapyd);

// Todas requieren autenticación
router.post('/crear', verificarToken, crearRecargaStripe);
router.post('/crear-rapyd', verificarToken, crearRecargaRapyd);
// ⚠️ 2Checkout DESHABILITADO - requiere configuración de sandbox/test
// router.post('/crear-2checkout', verificarToken, require('../controllers/recargaController').crearRecargaTwoCheckout);
router.post('/procesar-tarjeta', verificarToken, procesarRecargaTarjeta);
router.post('/procesar', verificarToken, procesarRecargaExitosa);
router.get('/historial', verificarToken, obtenerRecargas);
router.post('/canjear-codigo', verificarToken, canjearcoCodigo);
router.post('/generar-codigos', verificarToken, generarCodigos); // Solo admin

module.exports = router;
