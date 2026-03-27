const axios = require('axios');
const crypto = require('crypto');

const DEFAULT_RECV_WINDOW = '5000';

const NETWORK_MAP = {
  'BITCOIN NETWORK': 'BTC',
  'ERC-20 (ETHEREUM)': 'ETH',
  'TRC-20 (TRON)': 'TRX',
  'BEP-20 (BSC)': 'BSC',
  'SOLANA NETWORK': 'SOL',
  SOLANA: 'SOL',
  ARBITRUM: 'ARBI',
  OPTIMISM: 'OP',
  'DOGECOIN NETWORK': 'DOGE',
  'CARDANO NETWORK': 'ADA',
  ETHEREUM: 'ETH',
  TRON: 'TRX',
  BSC: 'BSC',
};

const getConfig = () => ({
  apiKey: String(process.env.BYBIT_API_KEY || '').trim(),
  apiSecret: String(process.env.BYBIT_API_SECRET || '').trim(),
  baseUrl: String(process.env.BYBIT_BASE_URL || 'https://api.bybit.com').trim(),
  recvWindow: String(process.env.BYBIT_RECV_WINDOW || DEFAULT_RECV_WINDOW).trim(),
});

const ensureConfigured = () => {
  const config = getConfig();
  if (!config.apiKey || !config.apiSecret) {
    throw new Error('Credenciales Bybit no configuradas (BYBIT_API_KEY/BYBIT_API_SECRET)');
  }
  return config;
};

const buildQueryString = (params = {}) => Object.entries(params)
  .filter(([, value]) => value !== undefined && value !== null && value !== '')
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  .join('&');

const signPayload = ({ apiKey, apiSecret, recvWindow, timestamp, payload }) => crypto
  .createHmac('sha256', apiSecret)
  .update(`${timestamp}${apiKey}${recvWindow}${payload}`)
  .digest('hex');

const requestPublic = async (endpoint, params = {}) => {
  const { baseUrl } = getConfig();
  const response = await axios.get(`${baseUrl}${endpoint}`, { params, timeout: 10000 });
  return response.data;
};

const requestPrivate = async (method, endpoint, params = {}) => {
  const config = ensureConfigured();
  const timestamp = Date.now().toString();
  const upperMethod = String(method || 'GET').toUpperCase();
  const payload = upperMethod === 'GET'
    ? buildQueryString(params)
    : JSON.stringify(params);
  const signature = signPayload({
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
    recvWindow: config.recvWindow,
    timestamp,
    payload,
  });

  const requestConfig = {
    method: upperMethod,
    url: `${config.baseUrl}${endpoint}`,
    timeout: 15000,
    headers: {
      'X-BAPI-API-KEY': config.apiKey,
      'X-BAPI-SIGN': signature,
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': config.recvWindow,
      'Content-Type': 'application/json',
    },
  };

  if (upperMethod === 'GET') {
    requestConfig.params = params;
  } else {
    requestConfig.data = params;
  }

  const response = await axios(requestConfig);
  const data = response.data || {};
  if (Number(data.retCode) !== 0) {
    throw new Error(data.retMsg || 'Error desconocido de Bybit');
  }

  return data;
};

const normalizeCoin = (coin) => String(coin || '').trim().toUpperCase();

const normalizeChain = (network, coin) => {
  const normalizedNetwork = String(network || '').trim().toUpperCase();
  if (!normalizedNetwork) {
    return normalizeCoin(coin);
  }

  return NETWORK_MAP[normalizedNetwork] || normalizedNetwork.replace(/[^A-Z0-9]/g, '') || normalizeCoin(coin);
};

const getSpotPriceUsd = async (coin) => {
  const symbol = normalizeCoin(coin);
  if (!symbol || symbol === 'USD' || symbol === 'USDT' || symbol === 'USDC') {
    return {
      coin: symbol || 'USDT',
      symbol: 'USDTUSDT',
      price: 1,
      change24h: 0,
    };
  }

  const data = await requestPublic('/v5/market/tickers', {
    category: 'spot',
    symbol: `${symbol}USDT`,
  });

  const ticker = data?.result?.list?.[0];
  const price = Number(ticker?.lastPrice || 0);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Bybit no devolvió precio spot válido para ${symbol}`);
  }

  return {
    coin: symbol,
    symbol: ticker.symbol,
    price,
    change24h: Number(ticker.price24hPcnt || 0),
  };
};

const createWithdrawal = async ({
  coin,
  chain,
  address,
  amount,
  tag,
  accountType = 'UNIFIED',
  feeType = 0,
  forceChain = 1,
  requestId,
}) => {
  const payload = {
    coin: normalizeCoin(coin),
    chain: normalizeChain(chain, coin),
    address: String(address || '').trim(),
    amount: String(amount),
    accountType,
    feeType,
    forceChain,
    requestId: requestId || crypto.randomUUID(),
  };

  if (tag) {
    payload.tag = String(tag).trim();
  }

  const data = await requestPrivate('POST', '/v5/asset/withdraw/create', payload);
  return {
    requestId: payload.requestId,
    raw: data,
    result: data.result || {},
  };
};

const queryWithdrawalRecords = async (params = {}) => {
  const data = await requestPrivate('GET', '/v5/asset/withdraw/query-record', params);
  return Array.isArray(data?.result?.rows) ? data.result.rows : [];
};

const getWithdrawalById = async ({ withdrawID, coin, requestId }) => {
  const rows = await queryWithdrawalRecords({ withdrawID, coin: normalizeCoin(coin), requestId });
  return rows.find((row) => {
    if (withdrawID && String(row.withdrawId || row.id || '') === String(withdrawID)) return true;
    if (requestId && String(row.withdrawId || row.id || row.requestId || '') === String(requestId)) return true;
    return false;
  }) || null;
};

const mapWithdrawalStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return 'enviada';
  if (['success', 'completed', 'complete', 'finished'].includes(normalized)) return 'completada';
  if (['fail', 'failed', 'cancel', 'cancelled', 'rejected'].includes(normalized)) return 'fallida';
  return 'enviada';
};

module.exports = {
  createWithdrawal,
  getSpotPriceUsd,
  getWithdrawalById,
  mapWithdrawalStatus,
  normalizeChain,
  normalizeCoin,
  queryWithdrawalRecords,
};