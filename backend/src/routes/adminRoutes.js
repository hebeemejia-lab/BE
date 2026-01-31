// Rutas del Panel de Administración
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verificarAdmin = require('../middleware/adminMiddleware');

// Todas las rutas requieren autenticación de admin
router.use(verificarAdmin);

// 🧪 Test endpoint
router.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Admin routes working' });
});

// 📊 Dashboard
router.get('/dashboard', adminController.obtenerDashboard);

// 👥 Usuarios
router.get('/usuarios', adminController.listarUsuarios);

// 💰 Préstamos
router.get('/prestamos', adminController.listarPrestamos);
router.get('/prestamos/:id', adminController.obtenerPrestamo);
router.post('/prestamos', adminController.crearPrestamoAdmin);
router.post('/prestamos/:prestamoId/cuotas', adminController.crearCuotasPrestamo);

// 💳 Cuotas
router.post('/cuotas/:cuotaId/pagar', adminController.registrarPagoCuota);
router.get('/cuotas/:cuotaId/recibo', adminController.obtenerReciboPago);

// 📧 Verificación de emails
router.post('/verificacion-masiva', adminController.enviarVerificacionMasiva);
router.post('/probar-smtp', adminController.probarSMTP);

// 💳 Pagos
router.get('/probar-2checkout', adminController.probar2Checkout);

module.exports = router;
