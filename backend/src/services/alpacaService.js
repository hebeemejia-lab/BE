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

const hasTradingCredentials = () => {
  const config = getConfig();
  return Boolean(config.apiKey && config.secretKey);
};

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
const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const COINGECKO_URL = 'https://api.coingecko.com/api/v3';
const REQUEST_TIMEOUT_MS = 8000;
const QUOTE_CACHE_TTL_MS = 30 * 1000;
const HISTORY_CACHE_TTL_MS = 10 * 60 * 1000;
const ALPACA_MARKETDATA_COOLDOWN_MS = 10 * 60 * 1000;
const PUBLIC_REQUEST_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent': 'BancoExclusivo/1.0 (+https://www.bancoexclusivo.lat)',
};
const quoteCache = new Map();
const historyCache = new Map();
let alpacaMarketDataBlockedUntil = 0;
const CRYPTO_ID_MAP = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  BNB: 'binancecoin',
  XRP: 'ripple',
  LTC: 'litecoin',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  SHIB: 'shiba-inu',
};

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

const getCryptoBase = (symbol) => {
  const normalized = normalizeCryptoSymbol(symbol);
  if (!normalized) {
    return '';
  }

  if (normalized.includes('/')) {
    return normalized.split('/')[0];
  }

  return normalized;
};

const getCoinGeckoId = (symbol) => {
  const base = getCryptoBase(symbol);
  return CRYPTO_ID_MAP[base] || null;
};

const getCachedValue = (cache, key) => {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.value;
};

const setCachedValue = (cache, key, value, ttlMs) => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });

  return value;
};

const buildPublicRequestConfig = (config = {}) => ({
  timeout: REQUEST_TIMEOUT_MS,
  ...config,
  headers: {
    ...PUBLIC_REQUEST_HEADERS,
    ...(config.headers || {}),
  },
});

const isAlpacaAuthError = (error) => [401, 403].includes(error?.response?.status);

const alpacaMarketDataAllowed = () => Date.now() >= alpacaMarketDataBlockedUntil;

const blockAlpacaMarketData = (error) => {
  if (!isAlpacaAuthError(error)) {
    return;
  }

  alpacaMarketDataBlockedUntil = Date.now() + ALPACA_MARKETDATA_COOLDOWN_MS;
};

const formatTimestamp = (value) => {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value === 'number') {
    return new Date(value * 1000).toISOString();
  }

  return value;
};

const buildDailyRangeFromLimit = (limit) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : 2;
  if (safeLimit <= 5) return '5d';
  if (safeLimit <= 30) return '1mo';
  if (safeLimit <= 90) return '3mo';
  if (safeLimit <= 180) return '6mo';
  return '1y';
};

const obtenerCotizacionYahoo = async (symbol) => {
  const normalizedSymbol = normalizeSymbol(symbol);
  const response = await axios.get(
    `${YAHOO_CHART_URL}/${encodeURIComponent(normalizedSymbol)}`,
    buildPublicRequestConfig({
      params: {
        interval: '1d',
        range: '5d',
      },
    }),
  );

  const result = response.data?.chart?.result?.[0];
  if (!result) {
    throw new Error(`Yahoo sin datos para ${normalizedSymbol}`);
  }

  const quoteSeries = result?.indicators?.quote?.[0] || {};
  const closes = Array.isArray(quoteSeries.close) ? quoteSeries.close.filter(Number.isFinite) : [];
  const lastClose = closes.length ? closes[closes.length - 1] : null;

  const price = Number(result.meta?.regularMarketPrice || result.meta?.previousClose || lastClose || 0);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Yahoo no devolvió precio valido para ${normalizedSymbol}`);
  }

  return formatQuote(normalizedSymbol, {
    ap: price,
    bp: price,
    t: new Date().toISOString(),
  }, 'us_equity');
};

const obtenerHistorialYahoo = async (symbol, limit = 100) => {
  const normalizedSymbol = normalizeSymbol(symbol);
  const range = buildDailyRangeFromLimit(limit);
  const response = await axios.get(
    `${YAHOO_CHART_URL}/${encodeURIComponent(normalizedSymbol)}`,
    buildPublicRequestConfig({
      params: {
        interval: '1d',
        range,
      },
    }),
  );

  const result = response.data?.chart?.result?.[0];
  if (!result) {
    throw new Error(`Yahoo sin historial para ${normalizedSymbol}`);
  }

  const timestamps = result.timestamp || [];
  const quote = result?.indicators?.quote?.[0] || {};
  const opens = quote.open || [];
  const highs = quote.high || [];
  const lows = quote.low || [];
  const closes = quote.close || [];
  const volumes = quote.volume || [];

  const bars = timestamps
    .map((ts, index) => {
      const close = Number(closes[index]);
      if (!Number.isFinite(close)) {
        return null;
      }

      const open = Number.isFinite(Number(opens[index])) ? Number(opens[index]) : close;
      const high = Number.isFinite(Number(highs[index])) ? Number(highs[index]) : close;
      const low = Number.isFinite(Number(lows[index])) ? Number(lows[index]) : close;
      const volume = Number.isFinite(Number(volumes[index])) ? Number(volumes[index]) : 0;

      return {
        timestamp: formatTimestamp(ts),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume,
      };
    })
    .filter(Boolean);

  if (!bars.length) {
    throw new Error(`Yahoo no devolvió barras para ${normalizedSymbol}`);
  }

  return bars.slice(-Math.max(1, Number(limit) || 1));
};

const obtenerCotizacionCoinGecko = async (symbol) => {
  const normalizedSymbol = normalizeCryptoSymbol(symbol);
  const coinId = getCoinGeckoId(normalizedSymbol);
  if (!coinId) {
    throw new Error(`CoinGecko no soporta ${normalizedSymbol}`);
  }

  const response = await axios.get(
    `${COINGECKO_URL}/simple/price`,
    buildPublicRequestConfig({
      params: {
        ids: coinId,
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_24hr_vol: true,
      },
    }),
  );

  const data = response.data?.[coinId];
  const price = Number(data?.usd);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`CoinGecko sin precio para ${normalizedSymbol}`);
  }

  return formatQuote(normalizedSymbol, {
    ap: price,
    bp: price,
    t: new Date().toISOString(),
  }, 'crypto');
};

const obtenerHistorialCoinGecko = async (symbol, limit = 100) => {
  const normalizedSymbol = normalizeCryptoSymbol(symbol);
  const coinId = getCoinGeckoId(normalizedSymbol);
  if (!coinId) {
    throw new Error(`CoinGecko no soporta ${normalizedSymbol}`);
  }

  const days = Math.max(2, Math.min(30, Number(limit) + 2 || 4));
  const response = await axios.get(
    `${COINGECKO_URL}/coins/${encodeURIComponent(coinId)}/market_chart`,
    buildPublicRequestConfig({
      params: {
        vs_currency: 'usd',
        days,
        interval: 'daily',
      },
    }),
  );

  const prices = response.data?.prices || [];
  const volumes = response.data?.total_volumes || [];

  const bars = prices
    .map((entry, index) => {
      const [timestampMs, closeRaw] = entry || [];
      const close = Number(closeRaw);
      if (!Number.isFinite(close)) {
        return null;
      }

      const volume = Number.isFinite(Number(volumes[index]?.[1])) ? Number(volumes[index][1]) : 0;

      return {
        timestamp: formatTimestamp(Math.floor(timestampMs / 1000)),
        open: parseFloat(close.toFixed(2)),
        high: parseFloat(close.toFixed(2)),
        low: parseFloat(close.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume,
      };
    })
    .filter(Boolean);

  if (!bars.length) {
    throw new Error(`CoinGecko sin historial para ${normalizedSymbol}`);
  }

  return bars.slice(-Math.max(1, Number(limit) || 1));
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

const buildDefaultQuote = (symbol, assetClass = 'us_equity') => formatQuote(
  normalizeCryptoSymbol(symbol),
  { ap: 0, bp: 0, t: new Date().toISOString() },
  assetClass,
);

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

  if (!hasTradingCredentials() || !alpacaMarketDataAllowed()) {
    return obtenerCotizacionCoinGecko(normalizedSymbol);
  }

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
    blockAlpacaMarketData(error);
    console.warn(`⚠️ Alpaca crypto falló, usando CoinGecko para ${normalizedSymbol}: ${error.message}`);
    try {
      return await obtenerCotizacionCoinGecko(normalizedSymbol);
    } catch (fallbackError) {
      throw new Error(`No se pudo obtener precio de ${normalizedSymbol}: ${fallbackError.message}`);
    }
  }
};

// Obtener cotización actual de una acción
const obtenerCotizacion = async (symbol) => {
  const normalizedSymbol = normalizeCryptoSymbol(symbol);
  const quoteCacheKey = normalizedSymbol;
  const cachedQuote = getCachedValue(quoteCache, quoteCacheKey);

  if (cachedQuote) {
    return cachedQuote;
  }

  try {
    if (isCryptoSymbol(normalizedSymbol)) {
      console.log(`📊 Obteniendo cotización crypto de ${normalizedSymbol}...`);
      const cryptoQuote = await obtenerCotizacionCrypto(normalizedSymbol);
      return setCachedValue(quoteCache, quoteCacheKey, cryptoQuote, QUOTE_CACHE_TTL_MS);
    }

    if (!hasTradingCredentials() || !alpacaMarketDataAllowed()) {
      console.warn(`⚠️ Alpaca sin credenciales, usando Yahoo para ${normalizedSymbol}`);
      try {
        const yahooQuote = await obtenerCotizacionYahoo(normalizedSymbol);
        return setCachedValue(quoteCache, quoteCacheKey, yahooQuote, QUOTE_CACHE_TTL_MS);
      } catch (yahooError) {
        console.error(`⚠️ Yahoo también falló para ${normalizedSymbol}, retornando default`);
        return setCachedValue(quoteCache, quoteCacheKey, buildDefaultQuote(normalizedSymbol, 'us_equity'), 5000);
      }
    }
    
    try {
      console.log(`📊 Obteniendo cotización Alpaca de ${normalizedSymbol}...`);
      
      const response = await axios.get(
        `${getDataUrl()}/v2/stocks/quotes/latest`,
        {
          headers: getHeaders(),
          params: {
            symbols: normalizedSymbol,
            feed: 'iex',
          },
          timeout: REQUEST_TIMEOUT_MS,
        },
      );

      const quote = response.data?.quotes?.[normalizedSymbol];
      if (!quote) {
        throw new Error(`Alpaca sin quote para ${normalizedSymbol}`);
      }

      console.log(`✅ ${normalizedSymbol}: $${Number(quote.ap || quote.bp || 0).toFixed(2)}`);

      return setCachedValue(
        quoteCache,
        quoteCacheKey,
        formatQuote(normalizedSymbol, quote, 'us_equity'),
        QUOTE_CACHE_TTL_MS,
      );
    } catch (error) {
      blockAlpacaMarketData(error);
      console.error(`❌ Error Alpaca obteniendo ${normalizedSymbol}:`, error.message);
      
      // Fallback a última cotización de cierre
      try {
        const fallback = await obtenerUltimoCierre(normalizedSymbol);
        return setCachedValue(quoteCache, quoteCacheKey, fallback, QUOTE_CACHE_TTL_MS);
      } catch (fallbackError) {
        try {
          console.warn(`⚠️ Ultra-fallback Yahoo para ${normalizedSymbol}`);
          const yahooQuote = await obtenerCotizacionYahoo(normalizedSymbol);
          return setCachedValue(quoteCache, quoteCacheKey, yahooQuote, QUOTE_CACHE_TTL_MS);
        } catch (yahooError) {
          console.error(`⚠️ Todos los fallbacks fallaron para ${normalizedSymbol}, retornando default`);
          return setCachedValue(quoteCache, quoteCacheKey, buildDefaultQuote(normalizedSymbol, 'us_equity'), 5000);
        }
      }
    }
  } catch (allError) {
    console.error(`🔴 Error CRÍTICO en obtenerCotizacion(${normalizedSymbol}):`, allError.message);
    const assetClass = isCryptoSymbol(normalizedSymbol) ? 'crypto' : 'us_equity';
    return setCachedValue(quoteCache, quoteCacheKey, buildDefaultQuote(normalizedSymbol, assetClass), 5000);
  }
};

// Obtener último precio de cierre
const obtenerUltimoCierre = async (symbol) => {
  if (!hasTradingCredentials() || !alpacaMarketDataAllowed()) {
    return obtenerCotizacionYahoo(symbol);
  }
  
  try {
    const response = await axios.get(
      `${getDataUrl()}/v2/stocks/bars/latest`,
      {
        headers: getHeaders(),
        params: {
          symbols: symbol,
          feed: 'iex',
        },
        timeout: REQUEST_TIMEOUT_MS,
      },
    );

    const bar = response.data?.bars?.[symbol];
    if (!bar) {
      throw new Error(`Alpaca sin barra latest para ${symbol}`);
    }

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
    blockAlpacaMarketData(error);
    console.warn(`⚠️ Fallback Yahoo en ultimo cierre de ${symbol}: ${error.message}`);
    try {
      return await obtenerCotizacionYahoo(symbol);
    } catch (fallbackError) {
      throw new Error(`Error obteniendo último cierre de ${symbol}: ${fallbackError.message}`);
    }
  }
};

// Obtener múltiples cotizaciones
const obtenerCotizaciones = async (symbols) => {
  try {
    const promesas = symbols.map(symbol => obtenerCotizacion(symbol));
    const resultados = await Promise.allSettled(promesas);
    
    const cotizaciones = resultados.reduce((acc, resultado) => {
      if (resultado.status === 'fulfilled' && resultado.value) {
        acc[resultado.value.symbol] = resultado.value;
      }
      return acc;
    }, {});
    
    // Si ninguna cotización se obtuvo, retornar objeto vacío (no lanzar error)
    console.log(`✅ Obtenidas ${Object.keys(cotizaciones).length}/${symbols.length} cotizaciones`);
    return cotizaciones;
  } catch (error) {
    console.error('❌ Error en obtenerCotizaciones:', error.message);
    return {}; // Return empty object instead of throwing
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
  const historyCacheKey = `${normalizedSymbol}:${timeframe}:${limit}`;
  const cachedHistory = getCachedValue(historyCache, historyCacheKey);

  if (cachedHistory) {
    return cachedHistory;
  }

  try {
    if (isCryptoSymbol(normalizedSymbol)) {
      try {
        if (!hasTradingCredentials() || !alpacaMarketDataAllowed()) {
          const coinGeckoHistory = await obtenerHistorialCoinGecko(normalizedSymbol, limit);
          return setCachedValue(historyCache, historyCacheKey, coinGeckoHistory, HISTORY_CACHE_TTL_MS);
        }

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
            timeout: REQUEST_TIMEOUT_MS,
          },
        );

        const bars = response.data?.bars?.[normalizedSymbol] || [];

        return setCachedValue(historyCache, historyCacheKey, bars.map((bar) => ({
          timestamp: bar.t,
          open: parseFloat(bar.o.toFixed(2)),
          high: parseFloat(bar.h.toFixed(2)),
          low: parseFloat(bar.l.toFixed(2)),
          close: parseFloat(bar.c.toFixed(2)),
          volume: bar.v,
        })), HISTORY_CACHE_TTL_MS);
      } catch (error) {
        blockAlpacaMarketData(error);
        console.warn(`⚠️ Alpaca crypto falló, usando CoinGecko para ${normalizedSymbol}:`, error.message);
        try {
          const coinGeckoHistory = await obtenerHistorialCoinGecko(normalizedSymbol, limit);
          return setCachedValue(historyCache, historyCacheKey, coinGeckoHistory, HISTORY_CACHE_TTL_MS);
        } catch (coinError) {
          console.error(`⚠️ CoinGecko también falló para ${normalizedSymbol}, retornando vacío`);
          return setCachedValue(historyCache, historyCacheKey, [], 5000);
        }
      }
    }

    if (!hasTradingCredentials() || !alpacaMarketDataAllowed()) {
      console.warn(`⚠️ Alpaca sin credenciales, usando Yahoo historial para ${normalizedSymbol}`);
      try {
        const yahooHistory = await obtenerHistorialYahoo(normalizedSymbol, limit);
        return setCachedValue(historyCache, historyCacheKey, yahooHistory, HISTORY_CACHE_TTL_MS);
      } catch (yahooError) {
        console.error(`⚠️ Yahoo falló para ${normalizedSymbol}, retornando vacío`);
        return setCachedValue(historyCache, historyCacheKey, [], 5000);
      }
    }
    
    try {
      const response = await axios.get(
        `${getDataUrl()}/v2/stocks/bars`,
        {
          headers: getHeaders(),
          params: {
            symbols: normalizedSymbol,
            timeframe,
            limit,
            feed: 'iex',
            sort: 'asc',
          },
          timeout: REQUEST_TIMEOUT_MS,
        },
      );

      const bars = response.data?.bars?.[normalizedSymbol] || [];

      return setCachedValue(historyCache, historyCacheKey, bars.map(bar => ({
        timestamp: bar.t,
        open: parseFloat(bar.o.toFixed(2)),
        high: parseFloat(bar.h.toFixed(2)),
        low: parseFloat(bar.l.toFixed(2)),
        close: parseFloat(bar.c.toFixed(2)),
        volume: bar.v,
      })), HISTORY_CACHE_TTL_MS);
    } catch (error) {
      blockAlpacaMarketData(error);
      console.warn(`⚠️ Alpaca stock fallback a Yahoo para ${normalizedSymbol}:`, error.message);
      try {
        const yahooHistory = await obtenerHistorialYahoo(normalizedSymbol, limit);
        return setCachedValue(historyCache, historyCacheKey, yahooHistory, HISTORY_CACHE_TTL_MS);
      } catch (yahooError) {
        console.error(`⚠️ Yahoo también falló para ${normalizedSymbol}, retornando vacío`);
        return setCachedValue(historyCache, historyCacheKey, [], 5000);
      }
    }
  } catch (allError) {
    console.error(`🔴 Error CRÍTICO en obtenerHistorial(${normalizedSymbol}):`, allError.message);
    return setCachedValue(historyCache, historyCacheKey, [], 5000);
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
