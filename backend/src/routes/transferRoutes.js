const express = require('express');
const router = express.Router();
const {
  realizarTransferencia,
  obtenerHistorial,
  obtenerEnviadas,
  obtenerRecibidas,
  transferenciaBancaria,
  solicitarRetiroCrypto,
} = require('../controllers/transferController');
const verificarToken = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.post('/realizar', verificarToken, realizarTransferencia);
router.post('/bancaria', verificarToken, transferenciaBancaria);
router.post('/retiro-crypto', verificarToken, solicitarRetiroCrypto);
router.get('/historial', verificarToken, obtenerHistorial);
router.get('/enviadas', verificarToken, obtenerEnviadas);
router.get('/recibidas', verificarToken, obtenerRecibidas);

module.exports = router;
