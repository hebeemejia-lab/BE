const express = require('express');
const router = express.Router();

const {
  recargarDesdeBanco,
  obtenerFundingHistorial,
  sincronizarFundingTransfer,
  sincronizarFundingPendientes,
} = require('../controllers/bankAccountController');
const verificarToken = require('../middleware/authMiddleware');

// Rutas canonicas de funding BE -> Alpaca.
router.post('/depositar', verificarToken, recargarDesdeBanco);
router.get('/historial', verificarToken, obtenerFundingHistorial);
router.post('/sincronizar', verificarToken, sincronizarFundingTransfer);
router.post('/sincronizar-pendientes', verificarToken, sincronizarFundingPendientes);

module.exports = router;
