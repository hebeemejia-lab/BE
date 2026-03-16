// backend/src/controllers/cryptoTransferController.js
const { User } = require('../models');
const { ethers } = require('ethers');

// Configuración de Ethereum (custodial wallet)
const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
const adminPrivateKey = process.env.ETH_ADMIN_PRIVATE_KEY || 'TU_CLAVE_PRIVADA_ADMIN';
const adminWallet = new ethers.Wallet(adminPrivateKey, provider);

/**
 * POST /crypto/transfer
 * Body: { toWalletId, amountEth }
 * Requiere usuario autenticado
 */
exports.transferEth = async (req, res) => {
  try {
    const { toWalletId, amountEth } = req.body;
    const fromUser = await User.findByPk(req.usuario.id);
    if (!fromUser || !fromUser.walletId) {
      return res.status(400).json({ mensaje: 'Usuario origen sin walletId' });
    }
    // Buscar usuario destino
    const toUser = await User.findOne({ where: { walletId: toWalletId } });
    if (!toUser) {
      return res.status(404).json({ mensaje: 'Usuario destino no encontrado' });
    }
    // Validar saldo (opcional, si tienes saldo en BD)
    // Ejecutar transferencia on-chain
    const tx = {
      to: toWalletId,
      value: ethers.parseEther(amountEth.toString()),
    };
    const txResponse = await adminWallet.sendTransaction(tx);
    await txResponse.wait();
    // Puedes guardar la transacción en BD
    res.json({ mensaje: 'Transferencia enviada', txHash: txResponse.hash });
  } catch (error) {
    console.error('❌ Error en transferencia ETH:', error);
    res.status(500).json({ error: error.message });
  }
};
