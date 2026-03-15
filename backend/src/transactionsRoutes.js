const transactionsRoutes = require('./routes/transactions');

module.exports = function(app) {
  app.use('/api/transactions', transactionsRoutes);
};
