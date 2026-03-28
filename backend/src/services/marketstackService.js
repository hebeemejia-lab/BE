const axios = require('axios');

const MARKETSTACK_API_KEY = 'a93f7a4947ee6ffd216751d81b593baa';

async function obtenerCotizacionMarketStack(symbol) {
  const url = `http://api.marketstack.com/v1/eod/latest?access_key=${MARKETSTACK_API_KEY}&symbols=${symbol}`;
  const response = await axios.get(url);
  const data = response.data;
  if (data && data.data && data.data.length > 0) {
    const price = data.data[0].close;
    return {
      symbol,
      price,
      source: 'marketstack'
    };
  } else {
    throw new Error(`No se pudo obtener precio de ${symbol} en MarketStack`);
  }
}

module.exports = { obtenerCotizacionMarketStack };
