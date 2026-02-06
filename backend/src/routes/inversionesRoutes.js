const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/authMiddleware');
const {
  comprarAccion,
  venderAccion,
  listarPosicionesAbiertas,
  obtenerPortfolio,
  obtenerCotizacionAccion,
  buscarAcciones,
  obtenerHistorialPrecios,
} = require('../controllers/inversionesController');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Comprar acción
router.post('/comprar', comprarAccion);

// Vender acción
router.post('/vender', venderAccion);

// Listar posiciones abiertas
router.get('/posiciones', listarPosicionesAbiertas);

// Obtener portfolio completo
router.get('/portfolio', obtenerPortfolio);

// Obtener cotización de una acción
router.get('/cotizacion/:symbol', obtenerCotizacionAccion);

// Buscar acciones por nombre o símbolo
router.get('/buscar', buscarAcciones);

// Obtener historial de precios (para gráficos)
router.get('/historial/:symbol', obtenerHistorialPrecios);

module.exports = router;
