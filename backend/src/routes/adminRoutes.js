// Rutas del Panel de Administración
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verificarAdmin = require('../middleware/adminMiddleware');

// Todas las rutas requieren autenticación de admin
router.use(verificarAdmin);

// 📊 Dashboard
router.get('/dashboard', adminController.obtenerDashboard);

// 💰 Préstamos
router.get('/prestamos', adminController.listarPrestamos);
router.get('/prestamos/:id', adminController.obtenerPrestamo);
router.post('/prestamos/:prestamoId/cuotas', adminController.crearCuotasPrestamo);

// 💳 Cuotas
router.post('/cuotas/:cuotaId/pagar', adminController.registrarPagoCuota);
router.get('/cuotas/:cuotaId/recibo', adminController.obtenerReciboPago);

// 📧 Verificación de emails
router.post('/verificacion-masiva', adminController.enviarVerificacionMasiva);

module.exports = router;
