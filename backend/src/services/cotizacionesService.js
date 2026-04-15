const axios = require('axios');
const alpacaService = require('./alpacaService');

function normalizeCryptoSymbol(symbol) {
  // Normaliza BTC/USD, btcusd, btc-usd, etc. a BTC/USD
  if (!symbol) return '';
  let s = String(symbol).toUpperCase().replace('-', '/').replace('_', '/');
  if (!s.includes('/')) {
    if (s.endsWith('USD')) s = s.replace('USD', '/USD');
  }
  return s;
}

function isCryptoSymbol(symbol) {
  return String(symbol || '').includes('/');
}

async function obtenerCotizacionCryptoFallback(symbol) {
  const base = normalizeCryptoSymbol(symbol).split('/')[0];
  const response = await axios.get('https://min-api.cryptocompare.com/data/price', {
    params: { fsym: base, tsyms: 'USD' },
    timeout: 7000,
  });
  const precio = Number(response?.data?.USD || 0);
  if (!Number.isFinite(precio) || precio <= 0) {
    throw new Error(`No se pudo obtener cotizacion fallback para ${base}`);
  }
  return {
    symbol: `${base}/USD`,
    precio,
    precioCompra: precio,
    precioVenta: precio,
    assetClass: 'crypto',
    source: 'fallback',
  };
}

async function obtenerCotizacionResiliente(symbol) {
  const normalized = String(symbol || '').toUpperCase();
  try {
    return await alpacaService.obtenerCotizacion(normalized);
  } catch (error) {
    if (!isCryptoSymbol(normalized)) {
      throw error;
    }
    return obtenerCotizacionCryptoFallback(normalized);
  }
}

module.exports = { obtenerCotizacionResiliente };