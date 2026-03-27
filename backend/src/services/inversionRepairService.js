const isCryptoSymbol = (symbol) => String(symbol || '').includes('/');

const toPositiveNumber = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const buildCantidadRecalculada = ({ costoTotal, precioCompra }) => {
  const costo = toPositiveNumber(costoTotal);
  const precio = toPositiveNumber(precioCompra);

  if (!costo || !precio) {
    return 0;
  }

  const recalculada = Number((costo / precio).toFixed(8));
  return Number.isFinite(recalculada) && recalculada > 0 ? recalculada : 0;
};

const reconcileOpenCryptoPosition = async (inversion) => {
  if (!inversion || !isCryptoSymbol(inversion.symbol) || String(inversion.estado || '') !== 'abierta') {
    return { inversion, repaired: false, valid: true };
  }

  const cantidadActual = Number(inversion.cantidad || 0);
  if (Number.isFinite(cantidadActual) && cantidadActual > 0) {
    return { inversion, repaired: false, valid: true };
  }

  const cantidadRecalculada = buildCantidadRecalculada({
    costoTotal: inversion.costoTotal,
    precioCompra: inversion.precioCompra,
  });

  if (!cantidadRecalculada) {
    return { inversion, repaired: false, valid: false };
  }

  inversion.cantidad = cantidadRecalculada;
  await inversion.save();

  return { inversion, repaired: true, valid: true };
};

const reconcileOpenPositions = async (inversiones = []) => {
  const repairedIds = [];
  const invalidIds = [];
  const validPositions = [];

  for (const inversion of inversiones) {
    const result = await reconcileOpenCryptoPosition(inversion);
    if (result.repaired) {
      repairedIds.push(inversion.id);
    }

    if (!result.valid) {
      invalidIds.push(inversion.id);
      continue;
    }

    validPositions.push(result.inversion);
  }

  return {
    validPositions,
    repairedIds,
    invalidIds,
  };
};

module.exports = {
  buildCantidadRecalculada,
  reconcileOpenCryptoPosition,
  reconcileOpenPositions,
};