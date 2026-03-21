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

const getBrokerConfig = () => ({
  apiKey: process.env.ALPACA_BROKER_API_KEY || process.env.ALPACA_BROKER_KEY,
  secretKey: process.env.ALPACA_BROKER_SECRET_KEY || process.env.ALPACA_BROKER_SECRET,
  baseUrl: process.env.ALPACA_BROKER_BASE_URL || 'https://broker-api.sandbox.alpaca.markets',
});

const ensureBrokerConfig = () => {
  const config = getBrokerConfig();
  if (!config.apiKey || !config.secretKey) {
    throw new Error('Credenciales Broker API no configuradas (ALPACA_BROKER_API_KEY/ALPACA_BROKER_SECRET_KEY)');
  }

  return config;
};

const getBrokerHeaders = () => {
  const config = ensureBrokerConfig();
  const credentials = Buffer.from(`${config.apiKey}:${config.secretKey}`).toString('base64');

  return {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/json',
    accept: 'application/json',
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

const normalizeFundingStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();

  if (!normalized) {
    return 'pending';
  }

  if (['settled', 'complete', 'completed', 'approved', 'posted'].includes(normalized)) {
    return 'settled';
  }

  if (['failed', 'rejected', 'returned', 'error'].includes(normalized)) {
    return 'failed';
  }

  if (['canceled', 'cancelled', 'revoked'].includes(normalized)) {
    return 'canceled';
  }

  return 'pending';
};

const formatAchRelationship = (relationship) => ({
  id: relationship?.id,
  accountId: relationship?.account_id,
  accountOwnerName: relationship?.account_owner_name,
  nickname: relationship?.nickname,
  statusRaw: relationship?.status,
  status: normalizeFundingStatus(relationship?.status),
  createdAt: relationship?.created_at,
  updatedAt: relationship?.updated_at,
});

const formatBrokerTransfer = (transfer) => ({
  id: transfer?.id,
  accountId: transfer?.account_id,
  relationshipId: transfer?.relationship_id,
  transferType: transfer?.transfer_type || 'ach',
  direction: transfer?.direction,
  timing: transfer?.timing,
  amount: transfer?.amount ? Number(transfer.amount) : 0,
  statusRaw: transfer?.status,
  status: normalizeFundingStatus(transfer?.status),
  createdAt: transfer?.created_at,
  updatedAt: transfer?.updated_at,
});

const formatBrokerPosition = (position) => ({
  assetId: position?.asset_id,
  symbol: normalizeCryptoSymbol(position?.symbol),
  qty: Number(position?.qty || 0),
  side: position?.side,
  avgEntryPrice: position?.avg_entry_price ? Number(position.avg_entry_price) : null,
  currentPrice: position?.current_price ? Number(position.current_price) : null,
  market_value: position?.market_value ? Number(position.market_value) : 0,
  unrealized_pl: position?.unrealized_pl ? Number(position.unrealized_pl) : 0,
  unrealized_plpc: position?.unrealized_plpc ? Number(position.unrealized_plpc) : 0,
  exchange: position?.exchange,
  source: 'alpaca',
});

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

const crearRelacionAchBroker = async ({
  accountId,
  accountOwnerName,
  bankAccountType,
  bankAccountNumber,
  bankRoutingNumber,
  nickname,
  processorToken,
  instant,
}) => {
  const config = ensureBrokerConfig();

  const payload = {};
  if (processorToken) {
    payload.processor_token = processorToken;
  } else {
    payload.account_owner_name = accountOwnerName;
    payload.bank_account_type = bankAccountType;
    payload.bank_account_number = bankAccountNumber;
    payload.bank_routing_number = bankRoutingNumber;
    if (nickname) {
      payload.nickname = nickname;
    }
    if (typeof instant === 'boolean') {
      payload.instant = instant;
    }
  }

  const response = await axios.post(
    `${config.baseUrl}/v1/accounts/${encodeURIComponent(accountId)}/ach_relationships`,
    payload,
    { headers: getBrokerHeaders() },
  );

  return formatAchRelationship(response.data);
};

const crearTransferenciaAchBroker = async ({
  accountId,
  relationshipId,
  amount,
  direction = 'INCOMING',
  timing = 'immediate',
}) => {
  const config = ensureBrokerConfig();
  const payload = {
    transfer_type: 'ach',
    relationship_id: relationshipId,
    amount: String(amount),
    direction,
    timing,
  };

  const response = await axios.post(
    `${config.baseUrl}/v1/accounts/${encodeURIComponent(accountId)}/transfers`,
    payload,
    { headers: getBrokerHeaders() },
  );

  return formatBrokerTransfer(response.data);
};

const listarTransferenciasAchBroker = async ({ accountId, direction }) => {
  const config = ensureBrokerConfig();
  const params = {};
  if (direction) {
    params.direction = direction;
  }

  const response = await axios.get(
    `${config.baseUrl}/v1/accounts/${encodeURIComponent(accountId)}/transfers`,
    {
      headers: getBrokerHeaders(),
      params,
    },
  );

  const transfers = Array.isArray(response.data) ? response.data : [];
  return transfers.map(formatBrokerTransfer);
};

const obtenerTransferenciaAchBroker = async ({ accountId, transferId }) => {
  const config = ensureBrokerConfig();
  try {
    const response = await axios.get(
      `${config.baseUrl}/v1/accounts/${encodeURIComponent(accountId)}/transfers/${encodeURIComponent(transferId)}`,
      { headers: getBrokerHeaders() },
    );

    return formatBrokerTransfer(response.data);

    const listarPosicionesCuentaBroker = async (accountId) => {
      if (!accountId) {
        return [];
      }

      const config = ensureBrokerConfig();

      try {
        const response = await axios.get(
          `${config.baseUrl}/v1/trading/accounts/${encodeURIComponent(accountId)}/positions`,
          { headers: getBrokerHeaders() },
        );

        const positions = Array.isArray(response.data) ? response.data : [];
        return positions.map(formatBrokerPosition);
      } catch (error) {
        if (error.response?.status === 404) {
          return [];
        }

        throw error;
      }
    };
  } catch (error) {
    if (error.response?.status !== 404) {
      throw error;
    }

    // Fallback defensivo cuando la API no expone endpoint individual en ciertos planes/entornos.
    const transfers = await listarTransferenciasAchBroker({ accountId });
    const transfer = transfers.find((item) => item.id === transferId);
    if (!transfer) {
      throw new Error(`Transferencia ${transferId} no encontrada en Broker API`);
    }

    return transfer;
  }
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

// Transferir fondos de BE a Alpaca via Broker API ACH (incoming)
const transferirFondosAAlpaca = async ({ accountId, relationshipId, monto }) => {
  return crearTransferenciaAchBroker({
    accountId,
    relationshipId,
    amount: monto,
    direction: 'INCOMING',
    timing: 'immediate',
  });
};

// Retirar fondos de Alpaca de vuelta a BE via Broker API ACH (outgoing)
const retirarFondosDeAlpaca = async ({ accountId, relationshipId, monto }) => {
  return crearTransferenciaAchBroker({
    accountId,
    relationshipId,
    amount: monto,
    direction: 'OUTGOING',
    timing: 'immediate',
  });
};

module.exports = {
  crearRelacionAchBroker,
  crearOrdenMercado,
  crearTransferenciaAchBroker,
  confirmarOrdenMercado,
  listarPosicionesCuentaBroker,
  listarTransferenciasAchBroker,
  normalizeFundingStatus,
  obtenerTransferenciaAchBroker,
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
