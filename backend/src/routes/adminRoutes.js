// Rutas del Panel de Administración
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verificarAdmin = require('../middleware/adminMiddleware');
const verificarAdminFull = require('../middleware/adminFullMiddleware');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

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
router.post('/cuotas/:cuotaId/pagar', adminController.registrarPagoCuota);
router.get('/cuotas/:cuotaId/recibo', adminController.obtenerReciboPago);

// 📧 Verificación de emails
router.post('/verificacion-masiva', adminController.enviarVerificacionMasiva);
router.post('/probar-smtp', adminController.probarSMTP);

// 💳 Pagos
router.get('/probar-2checkout', adminController.probar2Checkout);

// ENDPOINT TEMPORAL: Crear o resetear usuario admin
const ADMIN_RESET_TOKEN = process.env.ADMIN_RESET_TOKEN || 'supersecreto2406';

router.post('/reset-admin', async (req, res) => {
  const { token } = req.body;
  if (token !== ADMIN_RESET_TOKEN) {
    return res.status(401).json({ mensaje: 'Token inválido' });
  }
  try {
    const email = 'admin@bancoexclusivo.lat';
    const password = '2406';
    let admin = await User.findOne({ where: { email } });
    const passwordHash = await bcrypt.hash(password, 10);
    if (admin) {
      await admin.update({
        password: passwordHash,
        rol: 'admin',
        emailVerificado: true
      });
      return res.json({ mensaje: 'Usuario admin actualizado', email, password });
    } else {
      admin = await User.create({
        nombre: 'Administrador',
        email,
        password: passwordHash,
        cedula: '000-0000000-0',
        telefono: '000-000-0000',
        direccion: 'Oficina Central',
        saldo: 0,
        rol: 'admin',
        emailVerificado: true
      });
      return res.json({ mensaje: 'Usuario admin creado', email, password });
    }
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al crear/resetear admin', error: err.message });
  }
});

module.exports = router;
