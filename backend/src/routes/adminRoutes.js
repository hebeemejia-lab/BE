// Rutas del Panel de Administración
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// TODO: Agregar middleware de autorización para admin
// const isAdmin = require('../middleware/isAdmin');

// 📊 Dashboard
router.get('/dashboard', adminController.obtenerDashboard);

// 💰 Préstamos
router.get('/prestamos', adminController.listarPrestamos);
router.get('/prestamos/:id', adminController.obtenerPrestamo);
router.post('/prestamos/:prestamoId/cuotas', adminController.crearCuotasPrestamo);

// 💳 Cuotas
router.post('/cuotas/:cuotaId/pagar', adminController.registrarPagoCuota);
router.get('/cuotas/:cuotaId/recibo', adminController.obtenerReciboPago);

module.exports = router;
