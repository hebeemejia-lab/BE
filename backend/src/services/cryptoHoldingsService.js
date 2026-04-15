const Inversion = require('../models/Inversion');

const QUANTITY_EPSILON = 0.00000001;

const roundQuantity = (value) => parseFloat(Number(value || 0).toFixed(8));
const roundUsd = (value) => parseFloat(Number(value || 0).toFixed(2));

const normalizeCryptoSymbol = (coin) => {
  const normalized = String(coin || '').trim().toUpperCase();
  if (!normalized) return normalized;
  return normalized.includes('/') ? normalized : `${normalized}/USD`;
};

const getOpenCryptoLots = async ({ usuarioId, coin, transaction }) => Inversion.findAll({
  where: {
    usuarioId,
    symbol: normalizeCryptoSymbol(coin),
    estado: 'abierta',
  },
  order: [['fechaCompra', 'ASC'], ['createdAt', 'ASC'], ['id', 'ASC']],
  transaction,
});

const getAvailableCryptoBalance = async ({ usuarioId, coin, transaction }) => {
  const lots = await getOpenCryptoLots({ usuarioId, coin, transaction });
  return roundQuantity(lots.reduce((sum, lot) => sum + parseFloat(lot.cantidad || 0), 0));
};

const consumeCryptoBalance = async ({ usuarioId, coin, amount, transaction }) => {
  const requestedAmount = roundQuantity(amount);
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    throw new Error('Monto de activo invalido para consumo');
  }

  const lots = await getOpenCryptoLots({ usuarioId, coin, transaction });
  const availableBefore = roundQuantity(lots.reduce((sum, lot) => sum + parseFloat(lot.cantidad || 0), 0));

  if (availableBefore + QUANTITY_EPSILON < requestedAmount) {
    const error = new Error('Saldo insuficiente del activo');
    error.code = 'INSUFFICIENT_ASSET_BALANCE';
    error.available = availableBefore;
    error.requested = requestedAmount;
    throw error;
  }

  let remaining = requestedAmount;
  const consumedLots = [];

  for (const lot of lots) {
    if (remaining <= QUANTITY_EPSILON) break;

    const lotQuantity = roundQuantity(lot.cantidad);
    if (lotQuantity <= QUANTITY_EPSILON) {
      continue;
    }

    const consumeQuantity = roundQuantity(Math.min(lotQuantity, remaining));
    const lotCostTotal = parseFloat(lot.costoTotal || 0);
    const unitCost = lotQuantity > 0
      ? (lotCostTotal / lotQuantity)
      : parseFloat(lot.precioCompra || 0);
    const consumedCost = roundUsd(unitCost * consumeQuantity);

    consumedLots.push({
      sourceInversionId: lot.id,
      symbol: lot.symbol,
      cantidad: consumeQuantity,
      precioCompra: parseFloat(lot.precioCompra || unitCost || 0),
      costoTotal: consumedCost,
      fechaCompra: lot.fechaCompra,
    });

    if (lotQuantity - consumeQuantity <= QUANTITY_EPSILON) {
      lot.precioVenta = parseFloat(lot.precioCompra || unitCost || 0);
      lot.ingresoTotal = roundUsd(lotCostTotal);
      lot.ganancia = 0;
      lot.estado = 'cerrada';
      lot.fechaVenta = new Date();
      await lot.save({ transaction });
    } else {
      const remainingQuantity = roundQuantity(lotQuantity - consumeQuantity);
      const remainingCost = roundUsd(lotCostTotal - consumedCost);

      lot.cantidad = remainingQuantity;
      lot.costoTotal = remainingCost < 0 ? 0 : remainingCost;
      await lot.save({ transaction });

      await Inversion.create({
        usuarioId,
        symbol: lot.symbol,
        cantidad: consumeQuantity,
        precioCompra: parseFloat(lot.precioCompra || unitCost || 0),
        costoTotal: consumedCost,
        precioVenta: parseFloat(lot.precioCompra || unitCost || 0),
        ingresoTotal: consumedCost,
        ganancia: 0,
        estado: 'cerrada',
        tipo: 'venta',
        fechaCompra: lot.fechaCompra,
        fechaVenta: new Date(),
      }, { transaction });
    }

    remaining = roundQuantity(remaining - consumeQuantity);
  }

  return {
    availableBefore,
    availableAfter: roundQuantity(availableBefore - requestedAmount),
    consumedLots,
  };
};

const restoreConsumedCryptoBalance = async ({ usuarioId, consumedLots, transaction }) => {
  let restoredAmount = 0;

  for (const lot of consumedLots || []) {
    const quantity = roundQuantity(lot.cantidad);
    if (quantity <= QUANTITY_EPSILON) {
      continue;
    }

    await Inversion.create({
      usuarioId,
      symbol: normalizeCryptoSymbol(lot.symbol),
      cantidad: quantity,
      precioCompra: parseFloat(lot.precioCompra || 0),
      costoTotal: roundUsd(lot.costoTotal),
      estado: 'abierta',
      tipo: 'compra',
      fechaCompra: lot.fechaCompra || new Date(),
    }, { transaction });

    restoredAmount += quantity;
  }

  return roundQuantity(restoredAmount);
};

module.exports = {
  normalizeCryptoSymbol,
  getAvailableCryptoBalance,
  consumeCryptoBalance,
  restoreConsumedCryptoBalance,
};