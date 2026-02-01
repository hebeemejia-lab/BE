const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  obtenerSolicitudesRetiroManuales,
  aprobarSolicitudRetiroManual,
  rechazarSolicitudRetiroManual,
  obtenerEstadoSolicitudRetiro,
} = require('../controllers/retiroController');

// Todas las rutas requieren autenticación y rol de admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Obtener solicitudes pendientes de retiro manual
router.get('/solicitudes-retiro', obtenerSolicitudesRetiroManuales);

// Obtener estado de una solicitud específica
router.get('/solicitudes-retiro/:solicitudId/estado', obtenerEstadoSolicitudRetiro);

// Aprobar solicitud de retiro
router.post('/solicitudes-retiro/:solicitudId/aprobar', aprobarSolicitudRetiroManual);

// Rechazar solicitud de retiro
router.post('/solicitudes-retiro/:solicitudId/rechazar', rechazarSolicitudRetiroManual);

module.exports = router;
