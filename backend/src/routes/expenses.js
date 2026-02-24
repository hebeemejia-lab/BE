const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const jwt = require('jsonwebtoken');

const verificarToken = require('../middleware/authMiddleware');

// POST /transactions
router.post('/transactions', verificarToken, async (req, res) => {
  try {
    const { type, category, amount, date } = req.body;
    const transaction = new Transaction({
      type,
      category,
      amount,
      date,
      userId: req.usuario.id
    });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /transactions
router.get('/transactions', verificarToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.usuario.id });
    res.json(transactions);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /budget
router.post('/budget', verificarToken, async (req, res) => {
  try {
    const { category, limit } = req.body;
    const budget = new Budget({ category, limit, userId: req.usuario.id });
    await budget.save();
    res.status(201).json(budget);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /budget
router.get('/budget', verificarToken, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.usuario.id });
    res.json(budgets);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /reports
router.get('/reports', verificarToken, async (req, res) => {
  try {
    // Ejemplo: resumen mensual
    const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();
    const transactions = await Transaction.find({
      userId: req.usuario.id,
      date: {
        $gte: new Date(`${year}-${month}-01`),
        $lt: new Date(`${year}-${month + 1}-01`)
      }
    });
    // Agrupar por categoría
    const summary = {};
    transactions.forEach(t => {
      if (!summary[t.category]) summary[t.category] = 0;
      summary[t.category] += t.amount;
    });
    res.json({ summary, transactions });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
// Exportar datos
const { exportPDF, exportExcel } = require('../controllers/expensesExportController');
router.get('/export/pdf', verificarToken, exportPDF);
router.get('/export/excel', verificarToken, exportExcel);
