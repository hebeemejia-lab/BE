const axios = require('axios');

const MARKETSTACK_API_KEY = 'a93f7a4947ee6ffd216751d81b593baa';

async function obtenerCotizacionMarketStack(symbol) {
  // Mapea el símbolo a formato MarketStack (ej: MSFT -> MSFT.XNAS)
  let marketstackSymbol = symbol;
  // Puedes expandir este mapeo según tus necesidades
  if (symbol === 'MSFT') marketstackSymbol = 'MSFT.XNAS';
  if (symbol === 'AAPL') marketstackSymbol = 'AAPL.XNAS';
  // ...otros símbolos si es necesario

  const url = `http://api.marketstack.com/v1/eod/latest?access_key=${MARKETSTACK_API_KEY}&symbols=${marketstackSymbol}`;
  console.log(`[MarketStack] Consultando URL: ${url}`);
  try {
    const response = await axios.get(url);
    const data = response.data;
    console.log(`[MarketStack] Respuesta:`, JSON.stringify(data));
    if (data && data.data && data.data.length > 0) {
      const price = data.data[0].close;
      return {
        symbol: marketstackSymbol,
        price,
        source: 'marketstack'
      };
    } else {
      throw new Error(`No se pudo obtener precio de ${marketstackSymbol} en MarketStack`);
    }
  } catch (err) {
    console.error(`[MarketStack] Error consultando ${marketstackSymbol}:`, err.message);
    throw err;
  }
}

module.exports = { obtenerCotizacionMarketStack };
