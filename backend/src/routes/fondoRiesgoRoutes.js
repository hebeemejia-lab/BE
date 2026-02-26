const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/authMiddleware');
const verificarAdmin = require('../middleware/adminMiddleware');
const {
  getAnalysis,
  assignFund,
  updateFund,
  deleteFund
} = require('../controllers/fondoRiesgoController');

// Endpoints para fondo de riesgo
router.get('/analysis/:clientId', verificarToken, getAnalysis);
router.post('/clients/:id/funds', verificarAdmin, assignFund);
router.put('/clients/:id/funds', verificarAdmin, updateFund);
router.delete('/clients/:id/funds', verificarAdmin, deleteFund);

module.exports = router;
