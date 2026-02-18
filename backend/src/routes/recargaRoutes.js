// ...existing code...
const express = require('express');
const router = express.Router();
const {
  crearRecargaStripe,
  crearRecargaRapyd,
  crearRecargaPayPal,
  capturarRecargaPayPal,
  procesarRecargaTarjeta,
  procesarRecargaExitosa,
  obtenerRecargas,
  obtenerResumenPayPal,
  canjearcoCodigo,
  generarCodigos,
  crearRecargaTwoCheckout,
  webhookRapyd,
  webhookPayPal,
} = require('../controllers/recargaController');

console.log('✅ Imports del controller:');
console.log('   webhookRapyd:', typeof webhookRapyd);
console.log('   webhookPayPal:', typeof webhookPayPal);

const verificarToken = require('../middleware/authMiddleware');

console.log('🔄 Recarga routes loaded with crearRecargaRapyd:', typeof crearRecargaRapyd);

// Endpoint de debug - muestra rutas disponibles
router.get('/debug', (req, res) => {
  res.json({
    message: 'Recargas Routes v2.2',
    endpoints: [
      'POST /crear',
      'POST /crear-rapyd ← ENDPOINT RAPYD',
      'POST /crear-paypal ← ENDPOINT PAYPAL',
      'POST /paypal/capturar ← CAPTURA PAYPAL',
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

// Webhook de PayPal (SIN autenticación - viene desde PayPal)
router.post('/paypal/webhook', webhookPayPal);

// Paypal capture (SIN autenticación - viene desde PayPal, no tiene JWT)
router.post('/paypal/capturar', capturarRecargaPayPal);

// Todas requieren autenticación
router.post('/crear', verificarToken, crearRecargaStripe);
router.post('/crear-rapyd', verificarToken, crearRecargaRapyd);
router.post('/crear-paypal', verificarToken, crearRecargaPayPal);
router.post('/crear-2checkout', verificarToken, crearRecargaTwoCheckout);
router.post('/procesar-tarjeta', verificarToken, procesarRecargaTarjeta);
router.post('/procesar', verificarToken, procesarRecargaExitosa);
router.get('/historial', verificarToken, obtenerRecargas);
router.get('/resumen-paypal', verificarToken, obtenerResumenPayPal);
router.post('/canjear-codigo', verificarToken, canjearcoCodigo);
router.post('/generar-codigos', verificarToken, generarCodigos); // Solo admin

module.exports = router;
