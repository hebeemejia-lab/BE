// backend/src/routes/cryptoRoutes.js
const express = require('express');
const router = express.Router();
const { transferEth } = require('../controllers/cryptoTransferController');
const verificarToken = require('../middleware/authMiddleware');

// Endpoint para transferencias on-chain ETH
router.post('/transfer', verificarToken, transferEth);

module.exports = router;
