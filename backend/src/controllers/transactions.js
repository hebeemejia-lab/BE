// backend/src/controllers/transactions.js
const { createPayment } = require('../../services/crypto');

// Función de depósito
const deposit = async (req, res) => {
  try {
    const { amount, currency, address } = req.body;
    if (!amount || !currency) {
      return res.status(400).json({ error: 'amount y currency son requeridos' });
    }
    // Lógica real: crear pago en NOWPayments
    const payment = await createPayment(amount, currency);
    res.status(200).json({
      message: 'Depósito procesado correctamente',
      payment
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar el depósito', details: error.message });
  }
};

// Función de retiro (dummy con validaciones)
const withdraw = async (req, res) => {
  try {
    const { amount, currency, address } = req.body;

    // Validaciones básicas
    if (!amount || !currency || !address) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: amount, currency o address"
      });
    }

    // Aquí luego se integrará la llamada real a Kraken/Crypto APIs
    // Por ahora devolvemos una respuesta dummy
    return res.status(200).json({
      message: "Solicitud de retiro procesada (dummy)",
      data: {
        amount,
        currency,
        address
      }
    });
  } catch (error) {
    console.error("Error en withdraw:", error);
    return res.status(500).json({
      error: "Error interno al procesar el retiro"
    });
  }
};

module.exports = { deposit, withdraw };
