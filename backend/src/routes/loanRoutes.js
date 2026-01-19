const express = require('express');
const router = express.Router();
const {
  solicitarPrestamo,
  obtenerMisPrestamos,
  obtenerTodosPrestamos,
  aprobarPrestamo,
  rechazarPrestamo,
} = require('../controllers/loanController');
const verificarToken = require('../middleware/authMiddleware');

// Rutas protegidas
router.post('/solicitar', verificarToken, solicitarPrestamo);
router.get('/mis-prestamos', verificarToken, obtenerMisPrestamos);
router.get('/todos', verificarToken, obtenerTodosPrestamos); // Debería ser solo admin
router.post('/aprobar', verificarToken, aprobarPrestamo); // Debería ser solo admin
router.post('/rechazar', verificarToken, rechazarPrestamo); // Debería ser solo admin

module.exports = router;
