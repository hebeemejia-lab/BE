const {
  createPayment,
  registerDeposit,
  getKrakenBalance,
  withdrawKrakenFunds,
} = require('../services/crypto');

// Depositar
exports.deposit = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const payment = await createPayment(amount, currency);
    // Suponiendo que payment.wallet_id es devuelto por createPayment
    const walletId = payment.wallet_id || payment.payment_id;
    await registerDeposit(walletId, amount, currency);
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Retirar
exports.withdraw = async (req, res) => {
  try {
    const { amount, currency, address } = req.body;
    const balance = await getKrakenBalance();
    if (!balance[currency] || balance[currency] < amount) {
      return res.status(400).json({ success: false, error: 'Fondos insuficientes' });
    }
    const withdrawal = await withdrawKrakenFunds(amount, currency, address);
    res.json({ success: true, withdrawal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
