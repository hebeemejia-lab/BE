const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const verificarToken = require('../middleware/authMiddleware');
const { Op } = require('sequelize');

// POST /transactions
router.post('/transactions', verificarToken, async (req, res) => {
  try {
    const { type, category, amount, date } = req.body;
    const transaction = await Transaction.create({
      type,
      category,
      amount,
      date,
      userId: req.usuario.id
    });
    res.status(201).json(transaction);
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /transactions
router.get('/transactions', verificarToken, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({ 
      where: { userId: req.usuario.id },
      order: [['date', 'DESC']]
    });
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /budget
router.post('/budget', verificarToken, async (req, res) => {
  try {
    const { category, limit } = req.body;
    const budget = await Budget.create({ 
      category, 
      limit, 
      userId: req.usuario.id 
    });
    res.status(201).json(budget);
  } catch (err) {
    console.error('Error creating budget:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /budget
router.get('/budget', verificarToken, async (req, res) => {
  try {
    const budgets = await Budget.findAll({ 
      where: { userId: req.usuario.id } 
    });
    res.json(budgets);
  } catch (err) {
    console.error('Error fetching budgets:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /reports
router.get('/reports', verificarToken, async (req, res) => {
  try {
    // Ejemplo: resumen mensual
    const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();
    
    const startDate = new Date(`${year}-${String(month).padStart(2, '0')}-01`);
    const endDate = new Date(year, month, 1); // Primer día del siguiente mes
    
    const transactions = await Transaction.findAll({
      where: {
        userId: req.usuario.id,
        date: {
          [Op.gte]: startDate,
          [Op.lt]: endDate
        }
      }
    });
    
    // Agrupar por categoría
    const summary = {};
    transactions.forEach(t => {
      if (!summary[t.category]) summary[t.category] = 0;
      summary[t.category] += parseFloat(t.amount);
    });
    
    res.json({ summary, transactions });
  } catch (err) {
    console.error('Error generating reports:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
