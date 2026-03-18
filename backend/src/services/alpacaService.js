const axios = require('axios');

// Alpaca Trading API Service
// ⚠️ LIVE TRADING - DINERO REAL
// Este servicio ejecuta órdenes REALES en el mercado de valores

const getConfig = () => ({
  apiKey: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
  baseUrl: process.env.ALPACA_BASE_URL || 'https://api.alpaca.markets',
  mode: process.env.ALPACA_MODE || 'live',
});

// Headers de autenticación
const getHeaders = () => {
  const config = getConfig();
  return {
    'APCA-API-KEY-ID': config.apiKey,
    'APCA-API-SECRET-KEY': config.secretKey,
    'Content-Type': 'application/json',
  };
};

const TERMINAL_ORDER_STATUSES = new Set(['filled', 'canceled', 'expired', 'rejected', 'suspended', 'stopped', 'done_for_day']);

const CRYPTO_QUOTE_ASSETS = ['USD', 'USDT', 'USDC', 'BTC', 'ETH'];

const normalizeSymbol = (symbol) => String(symbol || '').trim().toUpperCase();

const normalizeCryptoSymbol = (symbol) => {
  const normalized = normalizeSymbol(symbol);

  if (!normalized || normalized.includes('/')) {
    return normalized;
  }

  const quoteAsset = CRYPTO_QUOTE_ASSETS.find(
    (quote) => normalized.endsWith(quote) && normalized.length > quote.length,
  );

  if (!quoteAsset) {
    return normalized;
  }

  return `${normalized.slice(0, -quoteAsset.length)}/${quoteAsset}`;
};

const isCryptoSymbol = (symbol) => normalizeCryptoSymbol(symbol).includes('/');

const getDataUrl = () => process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets';

const getAssetClass = (asset) => {
  if (asset?.class === 'crypto' || asset?.asset_class === 'crypto') {
    return 'crypto';
  }

  return 'us_equity';
};

const getAssetSearchRank = (asset, queryUpper) => {
  const symbol = normalizeSymbol(asset?.symbol);
  const compactSymbol = symbol.replace('/', '');
  const baseSymbol = symbol.includes('/') ? symbol.split('/')[0] : symbol;
  const name = normalizeSymbol(asset?.name);

  if (symbol === queryUpper || compactSymbol === queryUpper || baseSymbol === queryUpper) {
    return 0;
  }

  if (symbol.startsWith(queryUpper) || compactSymbol.startsWith(queryUpper) || baseSymbol.startsWith(queryUpper)) {
    return 1;
  }

  if (name.startsWith(queryUpper)) {
    return 2;
  }

  if (symbol.includes(queryUpper) || compactSymbol.includes(queryUpper) || baseSymbol.includes(queryUpper)) {
    return 3;
  }

  if (name.includes(queryUpper)) {
    return 4;
  }

  return 5;
};

const formatQuote = (symbol, quote, assetClass) => {
  const precioCompra = Number(quote?.ap || quote?.bp || quote?.p || 0);
  const precioVenta = Number(quote?.bp || quote?.ap || quote?.p || 0);
  const precio = precioCompra || precioVenta;

  return {
    symbol,
    precio: parseFloat(precio.toFixed(2)),
    precioCompra: parseFloat(precioCompra.toFixed(2)),
    precioVenta: parseFloat(precioVenta.toFixed(2)),
    timestamp: quote?.t,
    assetClass,
  };
};

const formatOrder = (order) => ({
  id: order?.id,
  clientOrderId: order?.client_order_id,
  symbol: normalizeCryptoSymbol(order?.symbol),
  qty: Number(order?.qty || 0),
  filledQty: Number(order?.filled_qty || 0),
  filledAvgPrice: order?.filled_avg_price ? Number(order.filled_avg_price) : null,
  notional: order?.notional ? Number(order.notional) : null,
  side: order?.side,
  status: order?.status,
  submittedAt: order?.submitted_at,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const obtenerActivos = async (assetClass) => {
  const config = getConfig();
  const response = await axios.get(
    `${config.baseUrl}/v2/assets`,
    {
      headers: getHeaders(),
      params: {
        status: 'active',
        asset_class: assetClass,
      },
    },
  );

  return Array.isArray(response.data) ? response.data : [];
};

const obtenerActivoPorSymbol = async (symbol) => {
  const config = getConfig();
  const normalizedSymbol = normalizeCryptoSymbol(symbol);

  try {
    const response = await axios.get(
      `${config.baseUrl}/v2/assets/${encodeURIComponent(normalizedSymbol)}`,
      { headers: getHeaders() },
    );

    return response.data;
  } catch (error) {
    if (error.response?.status !== 404 || !isCryptoSymbol(normalizedSymbol)) {
      throw error;
    }

    const cryptoAssets = await obtenerActivos('crypto');
    const cryptoAsset = cryptoAssets.find(
      (asset) => normalizeCryptoSymbol(asset.symbol) === normalizedSymbol,
    );

    if (cryptoAsset) {
      return cryptoAsset;
    }

    throw error;
  }
};

const obtenerCotizacionCrypto = async (symbol) => {
  const normalizedSymbol = normalizeCryptoSymbol(symbol);

  try {
    const response = await axios.get(
      `${getDataUrl()}/v1beta3/crypto/us/latest/quotes`,
      {
        headers: getHeaders(),
        params: { symbols: normalizedSymbol },
      },
    );

    const quote = response.data?.quotes?.[normalizedSymbol];
    if (!quote) {
      throw new Error(`No se encontró cotización para ${normalizedSymbol}`);
    }

    console.log(`✅ ${normalizedSymbol}: $${Number(quote.ap || quote.bp || 0).toFixed(2)}`);
    return formatQuote(normalizedSymbol, quote, 'crypto');
  } catch (error) {
    throw new Error(`No se pudo obtener precio de ${normalizedSymbol}: ${error.message}`);
  }
};

// Obtener cotización actual de una acción
const obtenerCotizacion = async (symbol) => {
  const normalizedSymbol = normalizeCryptoSymbol(symbol);
  const config = getConfig();

  if (isCryptoSymbol(normalizedSymbol)) {
    console.log(`📊 Obteniendo cotización crypto de ${normalizedSymbol}...`);
    return obtenerCotizacionCrypto(normalizedSymbol);
  }
  
  try {
    console.log(`📊 Obteniendo cotización de ${normalizedSymbol}...`);
    
    const response = await axios.get(
      `${config.baseUrl}/v2/stocks/${normalizedSymbol}/quotes/latest`,
      { headers: getHeaders() }
    );

    const quote = response.data.quote;
    console.log(`✅ ${normalizedSymbol}: $${Number(quote.ap || quote.bp || 0).toFixed(2)}`);

    return formatQuote(normalizedSymbol, quote, 'us_equity');
  } catch (error) {
    console.error(`❌ Error obteniendo cotización de ${normalizedSymbol}:`, error.message);
    
    // Fallback a última cotización de cierre
    try {
      const fallback = await obtenerUltimoCierre(normalizedSymbol);
      return fallback;
    } catch (fallbackError) {
      throw new Error(`No se pudo obtener precio de ${normalizedSymbol}: ${error.message}`);
    }
  }
};

// Obtener último precio de cierre
const obtenerUltimoCierre = async (symbol) => {
  const config = getConfig();
  
  try {
    const response = await axios.get(
      `${config.baseUrl}/v2/stocks/${symbol}/bars/latest`,
      {
        headers: getHeaders(),
        params: { feed: 'iex' },
      }
    );

    const bar = response.data.bar;
    const precio = bar.c; // closing price

    console.log(`📈 ${symbol} (cierre): $${precio.toFixed(2)}`);

    return {
      symbol,
      precio: parseFloat(precio.toFixed(2)),
      precioCompra: parseFloat(precio.toFixed(2)),
      precioVenta: parseFloat(precio.toFixed(2)),
      timestamp: bar.t,
    };
  } catch (error) {
    throw new Error(`Error obteniendo último cierre de ${symbol}: ${error.message}`);
  }
};

// Obtener múltiples cotizaciones
const obtenerCotizaciones = async (symbols) => {
  try {
    const promesas = symbols.map(symbol => obtenerCotizacion(symbol));
    const cotizaciones = await Promise.all(promesas);
    
    return cotizaciones.reduce((acc, cot) => {
      acc[cot.symbol] = cot;
      return acc;
    }, {});
  } catch (error) {
    console.error('❌ Error obteniendo cotizaciones múltiples:', error.message);
    throw error;
  }
};

const crearOrdenMercado = async ({ symbol, cantidad, side = 'buy', clientOrderId }) => {
  const config = getConfig();
  const normalizedSymbol = normalizeCryptoSymbol(symbol);
  const isCrypto = isCryptoSymbol(normalizedSymbol);
  const payload = {
    symbol: normalizedSymbol,
    qty: String(cantidad),
    side,
    type: 'market',
    time_in_force: isCrypto ? 'ioc' : 'day',
  };

  if (clientOrderId) {
    payload.client_order_id = String(clientOrderId).slice(0, 48);
  }

  const response = await axios.post(
    `${config.baseUrl}/v2/orders`,
    payload,
    { headers: getHeaders() },
  );

  return formatOrder(response.data);
};

const obtenerOrden = async (orderId) => {
  const config = getConfig();
  const response = await axios.get(
    `${config.baseUrl}/v2/orders/${encodeURIComponent(orderId)}`,
    { headers: getHeaders() },
  );

  return formatOrder(response.data);
};

const confirmarOrdenMercado = async (orderId, timeoutMs = 6000, pollIntervalMs = 400) => {
  const startedAt = Date.now();
  let lastOrder = await obtenerOrden(orderId);

  while ((Date.now() - startedAt) < timeoutMs) {
    if (TERMINAL_ORDER_STATUSES.has(lastOrder.status) || lastOrder.filledQty > 0) {
      return lastOrder;
    }

    await sleep(pollIntervalMs);
    lastOrder = await obtenerOrden(orderId);
  }

  return lastOrder;
};

// Buscar activo por símbolo o nombre
const buscarAccion = async (query, options = {}) => {
  const queryUpper = normalizeSymbol(query);
  const assetClassFilter = options.assetClass === 'crypto' ? 'crypto' : null;
  
  try {
    console.log(`🔍 Buscando activos: ${queryUpper}...`);

    const equityAssets = assetClassFilter === 'crypto' ? [] : await obtenerActivos('us_equity');
    const cryptoAssets = await obtenerActivos('crypto');

    const resultados = [...cryptoAssets, ...equityAssets]
      .filter((asset) => getAssetSearchRank(asset, queryUpper) < 5)
      .sort((left, right) => {
        const rankDiff = getAssetSearchRank(left, queryUpper) - getAssetSearchRank(right, queryUpper);
        if (rankDiff !== 0) {
          return rankDiff;
        }

        const tradableDiff = Number(Boolean(right.tradable)) - Number(Boolean(left.tradable));
        if (tradableDiff !== 0) {
          return tradableDiff;
        }

        const cryptoDiff = Number(getAssetClass(right) === 'crypto') - Number(getAssetClass(left) === 'crypto');
        if (cryptoDiff !== 0) {
          return cryptoDiff;
        }

        return normalizeSymbol(left.symbol).localeCompare(normalizeSymbol(right.symbol));
      })
      .slice(0, 10)
      .map((asset) => ({
        symbol: normalizeCryptoSymbol(asset.symbol),
        nombre: asset.name,
        exchange: asset.exchange,
        tradeable: asset.tradable,
        assetClass: getAssetClass(asset),
      }));

    console.log(`✅ Encontrados ${resultados.length} resultados`);
    return resultados;
  } catch (error) {
    console.error('❌ Error buscando activo:', error.message);
    throw new Error(`Error buscando: ${error.message}`);
  }
};

// Validar que una acción existe y es negociable
const validarAccion = async (symbol) => {
  const normalizedSymbol = normalizeCryptoSymbol(symbol);
  
  try {
    const asset = await obtenerActivoPorSymbol(normalizedSymbol);

    if (!asset.tradable) {
      throw new Error(`${normalizedSymbol} no es negociable`);
    }

    return {
      valid: true,
      symbol: normalizeCryptoSymbol(asset.symbol),
      nombre: asset.name,
      exchange: asset.exchange,
      assetClass: getAssetClass(asset),
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Activo ${normalizedSymbol} no encontrado`);
    }
    throw new Error(`Error validando ${normalizedSymbol}: ${error.message}`);
  }
};

// Obtener estado de la cuenta (paper trading)
const obtenerEstadoCuenta = async () => {
  const config = getConfig();
  
  try {
    const response = await axios.get(
      `${config.baseUrl}/v2/account`,
      { headers: getHeaders() }
    );

    return {
      efectivo: parseFloat(response.data.cash),
      poderCompra: parseFloat(response.data.buying_power),
      poderCompraNoMargen: parseFloat(response.data.non_marginable_buying_power || response.data.cash),
      valorPortfolio: parseFloat(response.data.portfolio_value),
      equity: parseFloat(response.data.equity),
    };
  } catch (error) {
    console.error('❌ Error obteniendo cuenta Alpaca:', error.message);
    return null;
  }
};

// Obtener historial de barras (gráficos)
const obtenerHistorial = async (symbol, timeframe = '1Day', limit = 100) => {
  const normalizedSymbol = normalizeCryptoSymbol(symbol);
  const config = getConfig();

  if (isCryptoSymbol(normalizedSymbol)) {
    try {
      const response = await axios.get(
        `${getDataUrl()}/v1beta3/crypto/us/bars`,
        {
          headers: getHeaders(),
          params: {
            symbols: normalizedSymbol,
            timeframe,
            limit,
            sort: 'asc',
          },
        },
      );

      const bars = response.data?.bars?.[normalizedSymbol] || [];

      return bars.map((bar) => ({
        timestamp: bar.t,
        open: parseFloat(bar.o.toFixed(2)),
        high: parseFloat(bar.h.toFixed(2)),
        low: parseFloat(bar.l.toFixed(2)),
        close: parseFloat(bar.c.toFixed(2)),
        volume: bar.v,
      }));
    } catch (error) {
      console.error(`❌ Error obteniendo historial de ${normalizedSymbol}:`, error.message);
      throw error;
    }
  }
  
  try {
    const response = await axios.get(
      `${config.baseUrl}/v2/stocks/${normalizedSymbol}/bars`,
      {
        headers: getHeaders(),
        params: {
          timeframe,
          limit,
          feed: 'iex',
        },
      }
    );

    return response.data.bars.map(bar => ({
      timestamp: bar.t,
      open: parseFloat(bar.o.toFixed(2)),
      high: parseFloat(bar.h.toFixed(2)),
      low: parseFloat(bar.l.toFixed(2)),
      close: parseFloat(bar.c.toFixed(2)),
      volume: bar.v,
    }));
  } catch (error) {
    console.error(`❌ Error obteniendo historial de ${normalizedSymbol}:`, error.message);
    throw error;
  }
};

// ⚠️ LIVE TRADING - Transferir fondos de BE a Alpaca
// ADVERTENCIA: Esto mueve dinero REAL del saldo BE a la cuenta de trading Alpaca
const transferirFondosAAlpaca = async (usuarioId, monto) => {
  const config = getConfig();
  
  if (config.mode !== 'live') {
    throw new Error('Transferencias de fondos solo disponibles en modo LIVE');
  }
  
  try {
    console.log(`💰 TRANSFERENCIA REAL: $${monto} → Alpaca para usuario ${usuarioId}`);
    console.log('⚠️  ADVERTENCIA: Esto moverá dinero REAL');
    
    // En producción, esto requeriría:
    // 1. Crear ACH relationship con banco del usuario
    // 2. Iniciar transferencia ACH
    // 3. Esperar 3-5 días hábiles para clearing
    
    // Por ahora, documentamos el proceso
    return {
      success: false,
      mensaje: 'Transferencias ACH requieren configuración adicional',
      pasos: [
        '1. Vincular cuenta bancaria USA con Alpaca',
        '2. Verificar cuenta (microdeposits)',
        '3. Iniciar ACH transfer',
        '4. Esperar 3-5 días para clearing',
      ],
      nota: 'Contacta soporte para habilitar funding automático',
    };
  } catch (error) {
    console.error('❌ Error transfiriendo fondos:', error.message);
    throw error;
  }
};

// Retirar fondos de Alpaca de vuelta a BE
const retirarFondosDeAlpaca = async (usuarioId, monto) => {
  const config = getConfig();
  
  if (config.mode !== 'live') {
    throw new Error('Retiros solo disponibles en modo LIVE');
  }
  
  try {
    console.log(`💵 RETIRO REAL: $${monto} de Alpaca → BE para usuario ${usuarioId}`);
    
    // Obtener saldo disponible en Alpaca
    const cuenta = await obtenerEstadoCuenta();
    
    if (!cuenta || cuenta.efectivo < monto) {
      throw new Error(`Saldo insuficiente en Alpaca. Disponible: $${cuenta?.efectivo || 0}`);
    }
    
    // En producción, esto requeriría iniciar ACH withdrawal
    return {
      success: false,
      mensaje: 'Retiros ACH requieren configuración adicional',
      saldoAlpaca: cuenta.efectivo,
      nota: 'Contacta soporte para procesar retiro',
    };
  } catch (error) {
    console.error('❌ Error retirando fondos:', error.message);
    throw error;
  }
};

module.exports = {
  crearOrdenMercado,
  confirmarOrdenMercado,
  obtenerCotizacion,
  obtenerCotizaciones,
  obtenerOrden,
  obtenerUltimoCierre,
  buscarAccion,
  validarAccion,
  obtenerEstadoCuenta,
  obtenerHistorial,
  transferirFondosAAlpaca,
  retirarFondosDeAlpaca,
};
