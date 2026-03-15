const express = require('express');
const router = express.Router();

// Controladores (ajusta según tu lógica real)
const { deposit, withdraw } = require('../../controllers/transactions');

// Rutas de transacciones
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);

module.exports = router;
