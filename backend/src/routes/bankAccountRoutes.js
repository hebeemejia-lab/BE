const express = require('express');
const router = express.Router();
const {
  vincularCuenta,
  verificarCuenta,
  listarCuentas,
  desvincularCuenta,
  recargarDesdeBanco,
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

module.exports = router;
