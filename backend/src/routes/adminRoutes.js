// Rutas del Panel de Administración
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verificarAdmin = require('../middleware/adminMiddleware');
const verificarAdminFull = require('../middleware/adminFullMiddleware');

// Todas las rutas requieren autenticación de admin
router.use(verificarAdmin);

// 🧪 Test endpoint
router.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Admin routes working' });
});

// 📊 Dashboard
router.get('/dashboard', adminController.obtenerDashboard);
router.get('/estado-mercantil', verificarAdminFull, adminController.obtenerEstadoMercantil);

// Estado de cuenta de usuario
router.get('/usuarios/:id/estado-cuenta', adminController.obtenerEstadoCuentaUsuario);
router.get('/usuarios/:id/resumen-deuda', adminController.obtenerResumenDeudaUsuario);
router.post('/usuarios/:id/depurar-sandbox', adminController.depurarPrestamosSandboxUsuario);

// 👥 Usuarios
router.get('/usuarios', adminController.listarUsuarios);
router.post('/usuarios', adminController.crearUsuarioAdmin);
router.put('/usuarios/:id', adminController.actualizarUsuarioAdmin);
router.delete('/usuarios/:id', adminController.eliminarUsuarioAdmin);

// 💰 Préstamos
router.get('/cuotas-vencidas', adminController.listarCuotasVencidas);
router.get('/prestamos', adminController.listarPrestamos);
router.get('/prestamos/:id', adminController.obtenerPrestamo);
router.post('/prestamos', adminController.crearPrestamoAdmin);
router.post('/prestamos/:prestamoId/cuotas', adminController.crearCuotasPrestamo);

// 💳 Cuotas
router.post('/prestamos/:prestamoId/agregar-cuota', adminController.agregarCuotaIndividual);
router.post('/cuotas/:cuotaId/pagar', adminController.registrarPagoCuota);
router.get('/cuotas/:cuotaId/recibo', adminController.obtenerReciboPago);

// 📧 Verificación de emails
router.post('/verificacion-masiva', adminController.enviarVerificacionMasiva);
router.post('/probar-smtp', adminController.probarSMTP);

// 💳 Pagos
router.get('/probar-2checkout', adminController.probar2Checkout);

module.exports = router;
