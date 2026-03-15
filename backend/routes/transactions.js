const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactions');

// POST /api/deposit
router.post('/deposit', transactionsController.deposit);

// POST /api/withdraw
router.post('/withdraw', transactionsController.withdraw);

module.exports = router;
