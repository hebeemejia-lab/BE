const express = require('express');
const router = express.Router();
const {
  vincularCuenta,
  verificarCuenta,
  listarCuentas,
  desvincularCuenta,
  recargarDesdeBanco,
  obtenerFundingHistorial,
  sincronizarFundingTransfer,
  sincronizarFundingPendientes,
  obtenerCuentaDefault,
  establecerDefault,
} = require('../controllers/bankAccountController');
const verificarToken = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.post('/vincular', verificarToken, vincularCuenta);
router.post('/verificar', verificarToken, verificarCuenta);
router.get('/listado', verificarToken, listarCuentas);
router.get('/default', verificarToken, obtenerCuentaDefault);
router.post('/default', verificarToken, establecerDefault);
router.post('/desvincular', verificarToken, desvincularCuenta);
router.post('/recargar', verificarToken, recargarDesdeBanco);
router.get('/funding/historial', verificarToken, obtenerFundingHistorial);
router.post('/funding/sincronizar', verificarToken, sincronizarFundingTransfer);
router.post('/funding/sincronizar-pendientes', verificarToken, sincronizarFundingPendientes);

module.exports = router;
